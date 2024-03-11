import { SessionDTO } from "src/core/session/model";
import { UserDTO } from "src/core/user/user.model";
import repository from './repository';

export async function create<T, P>(payload: T): Promise<P> {
  return repository.create(payload);
}

export async function find<T>(query: any): Promise<T[]> {
  return repository.find(query);
}

export async function findOne<T>(query: any): Promise<T> {
  return null;
}

export async function update<T>(query: any, payload: any): Promise<T[]> {
  return null;
}

export async function updateOne<T>(query: any, payload: any): Promise<T> {
  return null;
}

export async function connect(sessionId: SessionDTO["_id"], userId: UserDTO["_id"]) {}