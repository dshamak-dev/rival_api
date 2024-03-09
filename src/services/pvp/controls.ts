import model, { PayloadDTO, ModelDTO } from "./model";

// create session - Example: new Session({ rounds: 3, connectTimeout: "15s" })
export async function create(payload: PayloadDTO): Promise<ModelDTO>  {
  return model.create<ModelDTO>(payload); 
}

// find session
export async function findSession(query: any): Promise<ModelDTO[]> {
  return model.find(query);
}

// udate session
export async function updateSession(id: string, payload: PayloadDTO): Promise<ModelDTO> {
  return model.findOneAndUpdate({ _id: id }, payload);
}

// link session with player - Example: session.connect(): User
export async function connect(sessionId: string, userId: string) {
  // const _code = randomId(6);

  const session = await model.findOne<ModelDTO>({ _id: sessionId });

  if (!session) {
    return Promise.reject("Invalid session");
  }
  const { maxCapacity = 0, users = [] } = session;
  // validate session empty spots
  if (maxCapacity && users?.length === maxCapacity) {
    return Promise.reject("Capacity is full");
  }

  if (users.includes(userId)){
    return true;
  }

  // add playerCode to session whitelist
  const nextUsers = users.slice();
  nextUsers.push(userId);

  await model.findAndUpdate({ _id: sessionId }, { users: nextUsers });

  return true;
}
// auth user with platform by confirm email - Example user.auth({ email, tempCode }): boolean;
export async function auth() {}
// notify players on message - Example: user.on("message", (message) => void)
export async function on() {}
// send user interaction events - Example: user.send("request", { value: 5 })
export async function sendMessage() {}

// start session on agreement
// end session on reject or timeout

// set score to player via event - Example: session.send("roundEnd", { winner: "A" })
