import repository from "./repository";
import {
  TransactionDTO,
  TransactionPartyType,
  TransactionPayloadDTO,
} from "core/transaction/model";
import * as sessionActions from "core/session/actions";
import * as userActions from "core/user/actions";
import { UserDTO } from "core/user/model";
import * as voucherActions from 'core/voucher/actions';

export async function createVoucherTransaction(
  userId: UserDTO["_id"],
  voucherCode: string,
  details = null
): Promise<TransactionDTO> {
  const [error, voucher] = await voucherActions
    .findVoucher({ code: voucherCode })
    .then((voucher) => {
      if (!voucher) {
        return ['Voucher not found', null];
      }

      return [null, voucher];
    })
    .catch((error) => [error, null]);

  if (error) {
    return Promise.reject(error);
  }

  const voucherId = voucher._id;
  const voucherValue = voucher.value;

  const transactionPayload = {
    details: details || `Voucher used: ${voucherCode}`,
    sourceId: userId,
    sourceType: TransactionPartyType.User,
    targetType: TransactionPartyType.Voucher,
    targetId: voucherId,
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
    return Promise.reject('Invalid data');
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
  payload: TransactionPayloadDTO
): Promise<TransactionDTO> {
  const transaction = await repository.create(payload);

  const { _id, sourceId, sourceType, targetId, targetType } = transaction;

  await Promise.all([
    linkTransactionWithParty(_id, sourceId, sourceType),
    linkTransactionWithParty(_id, targetId, targetType),
  ]);

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
