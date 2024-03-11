import { createRepositoryModel } from "core/repository/controller";
import schema from "core/session/schema";
import { TransactionDTO } from "core/transaction/transaction.model";
import { UserDTO } from "core/user/model";

export interface SessionPayloadDTO {
  type: SessionType;
  visibility?: SessionVisibilityType;
  ownerId: UserDTO["_id"];
  config?: unknown;
  state?: unknown;
}

export interface SessionDTO {
  _id: string;
  type: SessionType;
  capacity: number;
  visibility?: SessionVisibilityType;
  ownerId: UserDTO["_id"];
  stage: SessionStageType;
  users: UserDTO["_id"][];
  transactions: TransactionDTO["_id"][];
  config?: unknown;
  state?: unknown;
  result?: unknown;
}

export enum SessionType {
  Draft = 0,
  Wager = 1,
  Game = 2,
}

export enum SessionVisibilityType {
  Private = 0,
  Public = 1,
  Protected = 2,
}

export enum SessionStageType {
  Draft = 0,
  Lobby = 1,
  Active = 2,
  Close = 3,
}

export const modelName = "Session";

export const model = createRepositoryModel(modelName, schema);
