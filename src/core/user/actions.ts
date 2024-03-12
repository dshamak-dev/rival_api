import { UserDTO } from "core/user/model";
import * as controls from "./controls";
import { TransactionDTO } from "core/transaction/model";
import repository from "./repository";

export async function addSession(userId, sessionId) {
  console.log("add session to user");

  return controls.addToArray(userId, "sessions", [sessionId]);
}

export async function addTransactions<T>(
  id: UserDTO["_id"],
  transactions: TransactionDTO["_id"][]
): Promise<T> {
  return repository.addToArray({ _id: id }, "transactions", transactions);
}
