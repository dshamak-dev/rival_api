import { UserDTO } from "core/user/model";
import * as controls from "./controls";
import { TransactionDTO } from "core/transaction/model";
import repository from "./repository";
import jwt from 'jsonwebtoken';

export async function  findUser(filter) {
  return repository.findOne(filter);
}

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

export function encodeUserToken(user: UserDTO) {
  const tokenData = { email: user.email, id: user._id };

  return jwt.sign(tokenData, process.env.TOKEN_SECRET);
}

export function decodeUserToken(token: string) {
  if (!token){
    return null;
  }

  return jwt.verify(token, process.env.TOKEN_SECRET);
}
