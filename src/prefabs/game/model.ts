import { SessionDTO, SessionPayloadDTO } from "core/session/model";
import { UserDTO } from "core/user/model";
import { TransactionDTO } from "core/transaction/model";

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
  offer?: number;
  rounds: { winners: UserDTO["_id"][], state?: any; }[];
}

export interface GameResultDTO {
  winners: UserDTO["_id"][];
  valueTotal: number;
  valuePerWinner: number;
}
