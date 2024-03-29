import { RivalManager } from "./model";

export const API_DOMAIN = `{ ENV_PATH }`;

const TOKEN_DOMAIN =
  document?.currentScript?.getAttribute("data-domain") ||
  location.host.replace(/(:[0-9]+)$/, "");
const AUTH_REDIRECT_URL = `${location.href}`;

export function clearAuth() {
  clearCookieByName("rivalAccessToken");
}

export function getAuthLink(manager: RivalManager) {
  if (!manager) {
    return null;
  }

  const sessionId = manager?.state?.id;

  return `${API_DOMAIN}/auth?sessionId=${sessionId}&action=connect&redirectUrl=${AUTH_REDIRECT_URL}&tokenDomain=${TOKEN_DOMAIN}`;
}

export async function postUserAction(type, payload) {
  const token = getCookieValue("rivalAccessToken");
  const authentication = token ? `Bearer ${token}` : "";

  return fetch(`${API_DOMAIN}/api/client/actions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: authentication,
    },
    credentials: "include",
    body: JSON.stringify({
      type,
      payload,
    }),
  }).then(async (res) => {
    if (res.status >= 400) {
      throw new Error(await res.text());
    }

    return res
  });
}

export function getCookieValue(key) {
  const cookie = document?.cookie;

  if (!cookie) {
    return null;
  }

  const entries = cookie.split(";").reduce((accum, item) => {
    const [key, value] = item.split("=");

    if (key) {
      accum[key] = value;
    }

    return accum;
  }, {});

  return entries[key];
}

export function clearCookieByName(cookieName) {
  const cookies = document.cookie?.split(";");
  const domain = location.host.replace(/(:[0-9]+)$/, "");
  // set past expiry to all cookies
  for (const it of cookies) {
    const [key, value] = it.split("=");
    if (key === cookieName) {
      const itemRecord = `${key}=${value}; expires=${new Date(
        0
      ).toUTCString()}; path=/; domain=.${domain}`;
      console.log(itemRecord);
      document.cookie = itemRecord;
    }
  }
}

export function connectEventSouce(sessionId, onMessage, onError) {
  if (!sessionId) {
    return null;
  }

  const source = new EventSource(
    `${API_DOMAIN}/api/client/${sessionId}/broadcast`,
    { withCredentials: true }
  );

  source.onmessage = (message) => {
    const messageData = JSON.parse(message.data);

    onMessage(messageData);
  };

  source.onerror = (error) => {
    onError(error);
  };

  return source;
}
