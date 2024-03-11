import { SessionDTO, SessionPayloadDTO } from "src/core/session/model";
import { UserDTO } from "src/core/user/user.model";
import { TransactionDTO } from "src/core/transaction/transaction.model";

export interface VersusPayloadDTO extends SessionPayloadDTO {
  config: VersusConfigDTO;
  state?: VersusStateDTO;
}

export interface VersusDTO extends SessionDTO {
  config: VersusConfigDTO;
  state?: VersusStateDTO;
  result?: VersusResultDTO;
}

export interface VersusConfigDTO {
  maxRounds: number;
  minUsers: number;
  maxUsers: number;
}

export interface VersusStateDTO {
  users: Record<UserDTO["_id"], { value: number; transactionId: TransactionDTO["_id"]; }>;
  rounds: { winners: UserDTO["_id"][] }[];
}

export interface VersusResultDTO {
  winners: UserDTO["_id"][];
  prizeTotal: number;
}
