import { SessionPayloadDTO } from "core/session/model";

export interface BetPayloadDTO extends SessionPayloadDTO {
  options: [] | string;
}