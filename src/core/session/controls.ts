import { emitEvent } from "core/broadcast/oberver";
import repository from "./repository";

export async function create<T, P>(payload: T): Promise<P> {
  return repository.create(payload);
}

export async function find<T>(query: any): Promise<T[]> {
  return repository.find(query);
}

export async function findOne<T>(query: any): Promise<T> {
  return repository.findOne(query);
}

export async function update<T>(query: any, payload: any): Promise<any> {
  return repository.findAndUpdate(query, payload);
}

export async function updateOne<T>(query: any, payload: any): Promise<T> {
  const session = await repository.findOneAndUpdate(query, payload);

  if (session?._id) {
    emitEvent("session", session._id, session);
  }

  return session;
}

export async function addUser(sessionId, userId) {
  return repository.addToArray({ _id: sessionId }, "users", [userId]);
}

export async function removeUser(sessionId, userId) {
  return repository.removeFromArray({ _id: sessionId }, "users", userId);
}

export async function setUserState(sessionId, userId, payload) {
  return repository.setToObject({ _id: sessionId }, "state.users", {
    key: userId,
    value: payload,
  });
}
