import * as sessionControls from "core/session/controls";
import { GameDTO, GamePayloadDTO } from "./model";
import { SessionDTO, SessionType } from "core/session/model";


export async function findById(sessionId: SessionDTO["_id"]): Promise<[string | null, GameDTO | null]> {
  if (!sessionId) {
    return ["Invalid data", null];
  }

  const session = await findOne({ _id: sessionId });

  if (!session) {
    return ["Invalid session", null];
  }

  return [null, session];
}

export async function create(payload: GamePayloadDTO): Promise<GameDTO> {
  const { config, ownerId, ...other } = payload;

  if (!ownerId?.trim()) {
    return Promise.reject("Session require valid owner");
  }

  const body: GamePayloadDTO = {
    ...other,
    ownerId,
    type: SessionType.Game,
    config: {
      maxRounds: 1,
      minUsers: 2,
      ...config,
    }
  };

  return sessionControls.create<GamePayloadDTO, GameDTO>(body);
}

export async function find(filter: any): Promise<GameDTO[]> {
  const _filter = Object.assign(filter, { type: SessionType.Game });

  return sessionControls.find<GameDTO>(_filter);
}

export async function findOne(filter: any): Promise<GameDTO> {
  const _filter = Object.assign(filter, { type: SessionType.Game });

  return sessionControls.findOne<GameDTO>(_filter);
}

export async function update(id: string, payload: any): Promise<GameDTO[]> {
  return sessionControls.update<GameDTO>({ _id: id }, payload);
}

export async function updateOne(id: string, payload: any): Promise<GameDTO> {
  return sessionControls.updateOne<GameDTO>({ _id: id }, payload);
}

// auth user with platform by confirm email - Example user.auth({ email, tempCode }): boolean;
// export async function auth() {}
// notify players on message - Example: user.on("message", (message) => void)
// export async function on() {}
// send user interaction events - Example: user.send("request", { value: 5 })
// export async function sendMessage() {}

// start session on agreement
// end session on reject or timeout

// set score to player via event - Example: session.send("roundEnd", { winner: "A" })
