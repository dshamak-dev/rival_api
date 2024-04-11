import { UserDTO, UserPayloadDTO } from "core/user/model";
import repository from "./repository";
import { emitEvent } from "core/broadcast/oberver";

export async function create(payload: UserPayloadDTO): Promise<UserDTO> {
  return repository.create(payload);
}

export async function find(query: any): Promise<UserDTO[]> {
  return repository.find(query);
}

export async function findOne(filter: any): Promise<UserDTO> {
  return repository.findOne(filter);
}

export async function update(filter: any, payload: any): Promise<any> {
  return repository.findAndUpdate(filter, payload);
}

export async function updateOne(filter: any, payload: any): Promise<UserDTO> {
  const user = await repository.findOneAndUpdate(filter, payload);

  if (user) {
    emitEvent('user', user._id, user);
  }

  return user;
}

export async function addToArray(
  id: string,
  field: string,
  items: any[]
): Promise<UserDTO> {
  return repository.addToArray({ _id: id }, field, items);
}
