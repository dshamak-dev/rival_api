import { createRepositoryModel } from "core/repository/controller";
import schema from "core/transaction/schema";

export interface TransactionPayloadDTO {
  details: string;
  value: number;
  sourceId: string;
  sourceType: TransactionPartyType;
  targetId: string;
  targetType: TransactionPartyType;
}

export interface TransactionDTO {
  _id: string;
  stage: TransactionStageType;
  details: string;
  value: number;
  sourceId: string;
  sourceType: TransactionPartyType;
  targetId: string;
  targetType: TransactionPartyType;
}

export enum TransactionStageType {
  Draft = 0,
  Pending = 1,
  Confirm = 2,
  Reject = 3
}

export enum TransactionPartyType {
  None = 0,
  User = 1,
  Session = 2,
  Voucher = 3
}

export const modelName = "Transaction";

export const model = createRepositoryModel(modelName, schema);