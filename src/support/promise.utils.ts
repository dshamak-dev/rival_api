export function parseResponseError(error): string {
  if (!error) {
    return null;
  }

  return error?.message || error;
}