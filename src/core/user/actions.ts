import { UserDTO } from "core/user/model";
import * as controls from "./controls";
import { TransactionDTO } from "core/transaction/model";
import repository from "./repository";
import jwt from "jsonwebtoken";
import { Request } from "express";
import { parseCookies } from "utils/cookie.utils";
import { emitEvent } from "core/broadcast/oberver";

export async function findUser(filter) {
  return repository.findOne(filter);
}

export async function addSession(userId, sessionId) {
  return controls.addToArray(userId, "sessions", [sessionId]);
}

export async function addUserAssets(userId, value) {
  const user = await repository.incrementNumber({ _id: userId }, "assets", value);

  if (user) {
    emitEvent('user', user._id, user);
  }

  return user;
}

export async function removeUserAssets(userId, value) {
  const user = await repository.decrementNumber({ _id: userId }, "assets", value);

  if (user) {
    emitEvent('user', user._id, user);
  }

  return user;
}

export async function addTransactions<T>(
  id: UserDTO["_id"],
  transactions: TransactionDTO["_id"][]
): Promise<T> {
  return repository.addToArray({ _id: id }, "transactions", transactions);
}

export function getUserCredentials(request: Request) {
  const cookies = parseCookies(request.headers.cookie);

  if (!cookies) {
    return null;
  }

  const token = cookies.rivalAccessToken;

  return decodeUserToken(token);
}

export function encodeUserToken(user: UserDTO) {
  const tokenData = { email: user.email, id: user._id };

  return jwt.sign(tokenData, process.env.TOKEN_SECRET);
}

export function decodeUserToken(
  token: string
): { email: string; id: string } | null {
  if (!token) {
    return null;
  }

  return jwt.verify(token, process.env.TOKEN_SECRET) as any;
}
