import * as controls from "./controls";

export async function addSession(userId, sessionId) {
  console.log("add session to user");

  return controls.addToArray(userId, "sessions", [sessionId]);
}