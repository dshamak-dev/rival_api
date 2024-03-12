import repository from "./repository";
import {
  TransactionDTO,
  TransactionPartyType,
  TransactionPayloadDTO,
} from "core/transaction/model";
import * as sessionActions from "core/session/actions";
import * as userActions from "core/user/actions";

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
