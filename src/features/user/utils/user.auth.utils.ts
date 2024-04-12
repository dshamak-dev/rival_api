import { decodeUserToken } from "core/user/actions";

export function getRequestUser(request) {
  const cookieToken = request.cookies?.rivalAccessToken;
  const authToken = request.headers["authorization"];

  let token = null;

  if (cookieToken) {
    token = cookieToken;
  } else if (authToken) {
    token = authToken.split(" ")[1];
  }

  let user: any = token ? decodeUserToken(token) : null;

  return user;
}
