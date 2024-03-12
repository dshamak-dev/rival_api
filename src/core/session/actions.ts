import { TransactionDTO } from "core/transaction/model";
import repository from "./repository";
import { SessionDTO } from "core/session/model";

export async function addTransactions<T>(
  id: SessionDTO["_id"],
  transactions: TransactionDTO["_id"][]
): Promise<T> {
  return repository.addToArray({ _id: id }, "transactions", transactions);
}
