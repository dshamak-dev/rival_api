import { createRepositoryModel } from "core/repository/controller";
import { UserDTO } from "core/user/model";
import schema from "core/voucher/schema";

export interface VoucherPayloadDTO {
  code: string;
  details?: string;
  capacity: number;
  value: number;
  ownerId?: string;
  ownertype?: number
}

export interface VoucherDTO {
  _id: string;
  code: string;
  details: string;
  capacity: number;
  value: number;
  counter: number;
  ownerId?: string;
  ownertype?: number;
  users: UserDTO["_id"][]
}

export const modelName = "Voucher";

export const model = createRepositoryModel(modelName, schema);