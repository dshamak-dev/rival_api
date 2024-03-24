export function parseCookies(cookies: string): Record<string, any> | null {
  if (!cookies) {
    return null;
  }

  return cookies
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});
}
