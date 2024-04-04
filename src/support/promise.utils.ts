export function parseResponseError(error): string {
  if (!error) {
    return null;
  }

  return error?.message || error;
}

export async function deferPromises(queue: Promise<any>[]) {
  return Promise.allSettled(queue);
}