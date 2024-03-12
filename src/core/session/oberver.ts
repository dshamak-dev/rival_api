import { SessionDTO } from "core/session/model";
import EventEmitter from "events";

const emitter = new EventEmitter();

export const emitSessionEvent = (session: SessionDTO) => {
  if (!session) {
    return;
  }

  const eventName = getEventName(session?._id);

  if (!eventName) {
    return;
  }

  emitter.emit(eventName, session);
};

export function addListener(
  sessionId: SessionDTO["_id"],
  callback: (session: SessionDTO) => void
) {
  const eventName = getEventName(sessionId);

  if (!eventName) {
    return;
  }

  emitter.on(eventName, (data: SessionDTO) => {
    try {
      callback(data);
    } catch (error) {
      removeListener(eventName, callback);
    }
  });
}

export function removeListener(eventName: string, callback) {
  emitter.removeListener(eventName, callback);
}

export function getEventName(sessionId: SessionDTO["_id"]) {
  if (!sessionId) {
    return null;
  }

  return `event-${sessionId}`;
}
