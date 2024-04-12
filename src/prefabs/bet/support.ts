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
  return deferPromises(transactionsPayload.map((it) => createTransaction(it)));
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
  return deferPromises(transactionsPayload.map((it) => createTransaction(it)));
}

export function parse(session, targetUser = null) {
  const {
    _id,
    users,
    capacity,
    config,
    state,
    title,
    details,
    result,
    stage,
  } = session;

  const payload = {
    title,
    details,
    stage,
    result,
    options: config?.options || [],
    id: _id,
    users: users?.length || 0,
    capacity: capacity || "∞",
    user: null,
    state: null,
  };

  if (targetUser) {
    const userId = targetUser._id || targetUser.id;
    payload.user = targetUser;
    payload.state = state?.users ? state.users[userId] : null;
  }

  return payload;
}
