import { SessionDTO, SessionPayloadDTO } from "core/session/model";
import { UserDTO } from "core/user/model";
import { TransactionDTO } from "core/transaction/transaction.model";

export interface GamePayloadDTO extends SessionPayloadDTO {
  config: GameConfigDTO;
  state?: GameStateDTO;
}

export interface GameDTO extends SessionDTO {
  config: GameConfigDTO;
  state?: GameStateDTO;
  result?: GameResultDTO;
}

export interface GameConfigDTO {
  maxRounds: number;
  minUsers: number;
  maxUsers: number;
}

export interface GameStateDTO {
  users: Record<UserDTO["_id"], { value: number; transactionId: TransactionDTO["_id"]; }>;
  rounds: { winners: UserDTO["_id"][] }[];
}

export interface GameResultDTO {
  winners: UserDTO["_id"][];
  prizeTotal: number;
}
