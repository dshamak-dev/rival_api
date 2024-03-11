import * as controls from "./controls";
import * as userActions from "core/user/actions";

// #start User region
export async function connectUser(sessionId, userId) {
  const session = await controls.findOne({ _id: sessionId });

  if (!session) {
    return Promise.reject("Invalid session");
  }

  const { capacity, users = [] } = session;

  if (capacity !== -1 && capacity && users?.length >= capacity) {
    return Promise.reject("Capacity is full");
  }

  if (users.includes(userId)) {
    return session;
  }

  const nextUsers = users.slice();
  nextUsers.push(userId);

  const updated = await controls.updateOne(sessionId, { users: nextUsers });

  await userActions.addSession(userId, sessionId);

  return updated;
}

export async function removeUser(sessionId, userId) {
  if (!sessionId || !userId) {
    return Promise.reject("Invalid data");
  }

  const session = await controls.findOne({ _id: sessionId });

  if (!session) {
    return Promise.reject("Invalid session");
  }

  const { users = [] } = session;

  const nextUsers = users.filter((it) => it !== userId);

  return controls.updateOne(sessionId, { users: nextUsers });
}