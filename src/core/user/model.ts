import { createRepositoryModel } from "core/repository/controller";
import { SessionDTO } from "core/session/model";
import { TransactionDTO } from "core/transaction/model";
import schema from "core/user/schema";

export interface UserPayloadDTO {
  email: string;
  password: string;
  fullName: string;
}

export interface UserDTO {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  assets: number;
  sessions: SessionDTO["_id"][];
  transactions: TransactionDTO["_id"][];
}

export const modelName = "User";

export const model = createRepositoryModel(modelName, schema);