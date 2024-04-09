export function parseResponseError(error): string {
  if (!error) {
    return null;
  }

  return error?.message || error;
}

export async function deferPromises(queue: Promise<any>[]) {
  return Promise.allSettled(queue);
}

export class Debouncer {
  store = {};

  constructor() {}

  async set(key) {
    if (!this.store[key]) {
      this.store[key] = [];

      return Promise.resolve();
    }

    const promise = new Promise((resolve) => {
      this.store[key].push(resolve);
    });

    return promise;
  }

  async next(key) {
    if (!this.store[key]?.length) {
      this.store[key] = null;

      return Promise.resolve();
    }

    const callback = this.store[key].shift();

    return callback();
  }
}