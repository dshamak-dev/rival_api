import EventEmitter from "events";

const emitter = new EventEmitter();

export const emitEvent = (prefix, id, payload) => {
  if (!prefix || !id) {
    return;
  }

  const eventName = getEventName(prefix, id);

  if (!eventName) {
    return;
  }

  emitter.emit(eventName, payload);
};

export function addListener(
  category,
  id,
  callback: (payload) => void
) {
  const eventName = getEventName(category, id);

  if (!eventName) {
    return;
  }

  emitter.on(eventName, (data) => {
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

export function getEventName(prefix, id) {
  if (!id) {
    return null;
  }

  return `${prefix}-${id}`;
}
