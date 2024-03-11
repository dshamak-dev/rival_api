import * as sessionControls from "src/core/session/controller";
import { VersusDTO, VersusPayloadDTO } from "./versus.model";
import { SessionType } from "src/core/session/model";

export async function create(payload: VersusPayloadDTO): Promise<VersusDTO> {
  const { config, ownerId, ...other } = payload;

  if (!ownerId?.trim()) {
    return Promise.reject("Session require valid owner");
  }

  const body: VersusPayloadDTO = {
    ...other,
    ownerId,
    type: SessionType.Versus,
    config: {
      maxRounds: 1,
      minUsers: 2,
      ...config,
    }
  };

  return sessionControls.create<VersusPayloadDTO, VersusDTO>(body);
}

export async function find(query: any): Promise<VersusDTO[]> {
  return sessionControls.find<VersusDTO>(
    Object.assign(query, { type: SessionType.Versus })
  );
}

export async function findOne(query: any): Promise<VersusDTO> {
  return sessionControls.findOne<VersusDTO>(
    Object.assign(query, { type: SessionType.Versus })
  );
}

export async function update(id: string, payload: any): Promise<VersusDTO[]> {
  return sessionControls.update<VersusDTO>({ _id: id }, payload);
}

export async function updateOne(id: string, payload: any): Promise<VersusDTO> {
  return sessionControls.updateOne<VersusDTO>({ _id: id }, payload);
}

export async function connect(sessionId: string, userId: string) {
  const session = await findOne({ _id: sessionId });

  if (!session) {
    return Promise.reject("Invalid session");
  }
  const { capacity, users = [] } = session;

  if (capacity && users?.length >= capacity) {
    return Promise.reject("Capacity is full");
  }

  if (users.includes(userId)) {
    return true;
  }

  const nextUsers = users.slice();
  nextUsers.push(userId);

  return updateOne(sessionId, { users: nextUsers });
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
