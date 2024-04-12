import repository from "./repository";
import {
  TransactionDTO,
  TransactionPartyType,
  TransactionPayloadDTO,
  TransactionStageType,
} from "core/transaction/model";
import * as sessionActions from "core/session/actions";
import * as userActions from "core/user/actions";
import { UserDTO } from "core/user/model";
import * as voucherActions from "core/voucher/actions";

export async function createVoucherTransaction(
  userId: UserDTO["_id"],
  voucherCode: string,
  details = null
): Promise<TransactionDTO> {
  const [error, voucher] = await voucherActions
    .findVoucher({ code: voucherCode })
    .then((voucher) => {
      if (!voucher) {
        return ["Voucher not found", null];
      }

      return [null, voucher];
    })
    .catch((error) => [error, null]);

  if (!userId || error || !voucher) {
    return Promise.reject(error || "Invalid voucher");
  }

  if (voucher.users?.includes(userId)) {
    return Promise.reject("Voucher already used");
  }

  const voucherId = voucher._id;
  const voucherValue = voucher.value;

  const transactionPayload = {
    details: details || `Voucher ${voucherCode}`,
    sourceId: voucherId,
    sourceType: TransactionPartyType.Voucher,
    targetType: TransactionPartyType.User,
    targetId: userId,
    value: voucherValue,
  };

  return createTransaction(transactionPayload);
}

export async function createTransferTransaction(
  fromUserId: UserDTO["_id"],
  toUser: Record<string, any>,
  value: number,
  details = null
): Promise<TransactionDTO> {
  const targetUser = await userActions.findUser(toUser);

  const toUserId = targetUser?._id;

  if (!fromUserId || !toUserId) {
    return Promise.reject("Invalid data");
  }

  const transactionPayload = {
    details: details || `Transfer to someone`,
    sourceId: fromUserId,
    sourceType: TransactionPartyType.User,
    targetType: TransactionPartyType.User,
    targetId: toUserId,
    value,
  };

  return createTransaction(transactionPayload);
}

export async function createTransaction(
  payload: TransactionPayloadDTO,
  autoResolve = true
): Promise<TransactionDTO> {
  const transaction = await repository.create(payload);

  const { _id, sourceId, sourceType, targetId, targetType } = transaction;

  await Promise.all([
    linkTransactionWithParty(_id, sourceId, sourceType),
    linkTransactionWithParty(_id, targetId, targetType),
  ]);

  if (autoResolve) {
    return tryResolveTransaction(transaction);
  }

  return transaction;
}

export async function linkTransactionWithParty(
  id: TransactionDTO["_id"],
  partyId: string,
  partyType: TransactionPartyType
): Promise<any> {
  switch (Number(partyType)) {
    case TransactionPartyType.Session: {
      return sessionActions.addTransactions(partyId, [id]);
    }
    case TransactionPartyType.User: {
      return userActions.addTransactions(partyId, [id]);
    }
  }

  return Promise.resolve(null);
}

export async function tryResolveTransaction(
  transaction: TransactionDTO
): Promise<TransactionDTO> {
  if (!transaction) {
    return transaction;
  }

  const {
    stage = 0,
    sourceType,
    sourceId,
    targetId,
    targetType,
    value,
  } = transaction;

  if (
    [TransactionStageType.Confirm, TransactionStageType.Reject].includes(stage)
  ) {
    return transaction;
  }

  switch (sourceType) {
    case TransactionPartyType.Voucher: {
      const ok = await voucherActions
        .useVoucher(targetId, { _id: sourceId })
        .then((res) => {
          return res != null;
        })
        .catch((err) => {
          console.log("voucher error", err);

          return false;
        });

      if (ok) {
        return confirmVoucherTransaction(transaction);
      } else {
        return rejectTransaction(transaction);
      }
    }
    case TransactionPartyType.User:
    case TransactionPartyType.Session: {
      return confirmTransferTransaction(transaction);
    }
  }

  return transaction;
}

export async function rejectTransaction(
  transaction: TransactionDTO
): Promise<TransactionDTO> {
  return repository.findOneAndUpdate(
    { _id: transaction._id },
    { stage: TransactionStageType.Reject }
  );
}

export async function confirmVoucherTransaction(
  transaction: TransactionDTO
): Promise<TransactionDTO> {
  const ok = await sendAssets(
    transaction.targetId,
    transaction.targetType,
    transaction.value
  );

  if (!ok) {
    return transaction;
  }

  return repository.findOneAndUpdate(
    { _id: transaction._id },
    { stage: TransactionStageType.Confirm }
  );
}

export async function confirmTransferTransaction(
  transaction: TransactionDTO
): Promise<TransactionDTO> {
  const ok = await Promise.all([
    sendAssets(transaction.targetId, transaction.targetType, transaction.value),
    removeAssets(
      transaction.sourceId,
      transaction.sourceType,
      transaction.value
    ),
  ]).then((results) => results.every((res) => res));

  if (!ok) {
    return transaction;
  }

  return repository.findOneAndUpdate(
    { _id: transaction._id },
    { stage: TransactionStageType.Confirm }
  );
}

export async function sendAssets(
  id: string,
  type: TransactionPartyType,
  value: number
): Promise<boolean> {
  let error = null;

  switch (type) {
    case TransactionPartyType.User: {
      await userActions.addUserAssets(id, value).catch((error) => {
        error = error;
      });
      break;
    }
  }

  return !error;
}

export async function removeAssets(
  id: string,
  type: TransactionPartyType,
  value: number
): Promise<boolean> {
  let error = null;

  switch (type) {
    case TransactionPartyType.User: {
      await userActions.removeUserAssets(id, value).catch((error) => {
        error = error;
      });
      break;
    }
  }

  return !error;
}
