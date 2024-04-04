import { createTransaction } from "core/transaction/actions";
import { TransactionPartyType } from "core/transaction/model";
import { UserDTO } from "core/user/model";
import { deferPromises } from "support/promise.utils";

export function calculateSummary(session) {
  let total = 0;
  const grouped: any = {};
  const bids: any = {};

  Object.entries(session.state.users).forEach(([userId, userState]) => {
    const { option, value }: any = userState || {};

    const _value = Number(value) || 0;
    total += _value;

    if (!grouped[option]) {
      grouped[option] = { total: 0 };
    }

    grouped[option].total += _value;

    bids[userId] = { total: _value, option };
  });

  // calculate user bet factor
  Object.entries(bids).forEach(([userId, { total, option }]: any) => {
    const optionTotal = grouped[option].total;

    const factor = total / optionTotal;

    bids[userId].factor = factor;
  });

  // calculate options factor
  Object.keys(grouped).forEach((option) => {
    const factor = grouped[option].total / total;

    grouped[option].factor = factor;
  });

  return {
    total,
    grouped,
    bids,
  };
}

export async function createBidTransactions(
  sessionId,
  userEntries: Record<UserDTO["_id"], { value: number }>,
  details
) {
  const transactionsPayload = Object.entries(userEntries).map(
    ([userId, { value }]: any) => {
      return {
        details,
        sourceId: userId,
        sourceType: TransactionPartyType.User,
        targetId: sessionId,
        targetType: TransactionPartyType.Session,
        value,
      };
    }
  );
  return deferPromises(transactionsPayload.map(createTransaction));
}

export function getWinners(session, answerOption) {
  const { state: { summary } } = session;
  const { total, bids } = summary;

  const winners = Object.entries(bids).reduce((accum, [userId, { option, factor }]: any) => {
    if (answerOption === option) {
      accum[userId] = { value: Number(total) * Number(factor) };
    }

    return accum;
  }, {});

  return winners;
}

export async function createRewardTransactions(
  sessionId,
  userEntries: Record<UserDTO["_id"], { value: number }>,
  details
) {
  const transactionsPayload = Object.entries(userEntries).map(
    ([userId, { value }]: any) => {
      return {
        details,
        sourceId: sessionId,
        sourceType: TransactionPartyType.Session,
        targetId: userId,
        targetType: TransactionPartyType.User,
        value,
      };
    }
  );
  return deferPromises(transactionsPayload.map(createTransaction));
}
// export async function setSessionActiveStage(
//   _id: SessionDTO["_id"]
// ): Promise<SessionDTO | null> {
//   // 1 - get session
//   const session = await findSession({ _id });

//   if (!session) {
//     return Promise.reject("Invalid session id");
//   }

//   // 4 - calculate options summ and percent for each user
//   let error = null;
//   const sessionSummary = await calculateWagerSummary(session).catch((err) => {
//     error = err;
//     return null;
//   });

//   if (error || !sessionSummary) {
//     return Promise.reject(error || "Invalid session data");
//   }

//   const {
//     total,
//     validTransactions,
//     invalidUsers,
//     optionsSummary,
//     usersSummary,
//   } = sessionSummary;

//   if (
//     !total ||
//     !validTransactions?.length ||
//     isEmptyObject(usersSummary) ||
//     isEmptyObject(optionsSummary)
//   ) {
//     return Promise.reject(error || "Invalid session data");
//   }

//   const { transactions = [], users } = session;

//   // remove invalid transactions
//   const invalidTransactions = transactions.filter(
//     (it) => !validTransactions.includes(stringifyObjectId(it))
//   );
//   await execPromiseQueue(
//     invalidTransactions.map((it) => {
//       return () => deleteSessionTransaction(_id, it);
//     })
//   );

//   // remove invalid users
//   const usersToStay = Object.keys(usersSummary);

//   const usersToLeave = users.filter(
//     (it) => !usersToStay.includes(stringifyObjectId(it))
//   );
//   const results = await execPromiseQueue(
//     usersToLeave.map((userId) => {
//       return () => requestSessionLeave(_id, stringifyObjectId(userId));
//     })
//   );

//   const currentSession = await findSession({ _id });

//   if (!currentSession) {
//     return Promise.reject(error || "Something went wrong!");
//   }

//   // 2 - confirm transactions
//   await execPromiseQueue(
//     validTransactions.map((it) => {
//       return () => confirmTransaction(it);
//     })
//   );

//   // set active stage
//   const payload = {
//     stage: SessionStageType.Active,
//     data: {
//       ...currentSession.data,
//       total,
//       optionsSummary,
//       usersSummary,
//     },
//   };

//   // 7 - save updates
//   const updated = await updateOneSession(_id, payload);

//   return parseMongoModel(updated);
// }
