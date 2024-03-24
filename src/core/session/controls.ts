import { emitEvent } from 'core/broadcast/oberver';
import repository from './repository';

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

  emitEvent('session', session._id, session);

  return session;
}

