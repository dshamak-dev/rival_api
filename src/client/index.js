const apiDomain = `{ ENV_PATH }`;

const current = document.currentScript;
const templateId = current.getAttribute("data-template");
const tokenDomain = current.getAttribute("data-domain") || location.host;
const env = {
  tokenKey: "rival-token",
  playerKey: "rival-player",
};

const storage = localStorage;
const token = storage.getItem(env.tokenKey);
let playerId = storage.getItem(env.playerKey);

if (!playerId) {
  playerId = createId(8);

  storage.setItem(env.playerKey, playerId);
}

class GameClient {
  player = null;
  listeners = {};
  stream;
  el;

  constructor() {
    this.player = playerId
      ? {
          playerId,
        }
      : null;

    this.el = document.createElement("div");
    this.el.style = `position: absolute; top: 0; right: 0; z-index: 2; color: white; background: black;`;

    document.body.append(this.el);
  }

  render(message) {
    if (!this.game) {
      return (this.el.innerHTML = message);
    }

    const { stage = 0, offer, logged, userState } = this.game;

    if (stage === 3) {
      const isWin = userState.winState;

      if (isWin) {
        this.notify("message", `Your prize is ${userState.total}`, () => {});
      }

      return (this.el.innerHTML = `You ${isWin ? "WIN" : "LOST"}!`);
    } else if (stage > 1) {
      this.el.innerHTML = offer ? `game in progress` : "no agreement";
    } else {
      const isConfirmed = offer === userState?.value;
      this.el.innerHTML =
        message ||
        `Rival offer: ${offer} ${isConfirmed ? "confirmed" : "pending"}`;
    }
    this.el.setAttribute("logged", logged);
    this.el.setAttribute("data-user-id", userState?.email);
    /**
     * 0 - pending
     * 1 - confirm
     */

    const setOfferValue = this.setOfferValue.bind(this);

    this.el.onclick = (ev) => {
      if (!logged) {
        return this.notify("auth", `You are not logged in.`, (ok) => {
          alert(`Answer: ${ok}`);
        });
      }

      if (stage > 1) {
        return;
      }

      if (!offer) {
        this.notify("confirm", `Set your bet!`, (value) => {
          setOfferValue(value);
        });
      } else {
        this.notify(
          "confirm",
          `Current offer is ${offer}.<br/>Do you accept?`,
          (value) => {
            setOfferValue(value);
          }
        );
      }
    };
  }

  notify(type, message, callback) {
    document.getElementById('rival-popup')?.remove();

    const offer = this.game?.offer || 1;
    const popupEl = document.createElement("div");
    popupEl.setAttribute("data-type", "overlay");
    popupEl.setAttribute("id", "rival-popup");

    const sessionId = this.game.id;
    const authUrl = `${location.href}`;

    popupEl.innerHTML = `<div data-type="content" class="content">
      <div>${message}</div>
      <div>
        ${
          type === "auth"
            ? `<a href="${apiDomain}/auth?sessionId=${sessionId}&action=connect&redirectUrl=${authUrl}&tokenDomain=${tokenDomain}">log in</a>`
            : type === "confirm"
            ? `
              <div><input type="number" data-type="input" min="1" value="${offer}" /></div>
              <div>
                <button data-type="button" data-value="true">OK</button>
                <button data-type="button" data-value="false">CANCEL</button>
              <div>
            `
            : `<div>
              <button data-type="button" data-value="true">OK</button>
            <div>`
        }
      </div>
    </div>`;

    popupEl.onclick = (ev) => {
      const target = ev.target;

      const targetType = target.getAttribute("data-type");

      switch (targetType) {
        case "button": {
          const ok = target.getAttribute("data-value") === "true";
          const value = popupEl.querySelector(
            'input[data-type="input"]'
          )?.value;

          callback(ok ? value : null);
          popupEl.remove();
          break;
        }
        case "overlay": {
          popupEl.remove();
          break;
        }
      }
    };

    document.body.append(popupEl);
  }

  async connect(gameTag) {
    this.gameTag = gameTag;

    if (!templateId) {
      console.warn("invalid template");
      return;
    }

    this.render("Rival connecting..");
    this.dispatchAction("connect", {
      templateId,
    }).then((game) => {
      this.subscribe();
    });
  }

  setState(payload) {
    this.game = payload;

    console.log("current state", this.game);
  }

  setOfferValue(value) {
    this.dispatchAction("offer", { value });
  }

  setScore(value) {
    this.dispatchAction("score", { score: value });
  }

  join() {
    // todo: validate current auth

    return auth().then((token) => {
      return token;
    });
  }

  on(event, callback) {
    this.listeners[event] = callback;
  }

  removeListener(event) {
    this.listeners[event] = null;
  }

  dispatchEvent(event, data) {
    if (this.listeners[event] instanceof Function) {
      this.listeners[event](data);
    }
  }

  dispatchAction(type, payload) {
    const tag = this.gameTag;

    return fetch(`${apiDomain}/api/client/actions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        type,
        payload: {
          tag,
          ...payload,
        },
      }),
    })
      .then((res) => res.json())
      .then(async (game) => {
        if (!game) {
          this.render("Rival fail");
          throw new Error("game not found");
        }

        this.setState(game);

        this.render();

        return game;
      })
      .catch((error) => {
        this.render("Rival error." + error);
      });
  }

  subscribe() {
    if (this.stream) {
      this.stream.close();
    }

    if (!this.game?.id) {
      return;
    }

    const _self = this;

    this.stream = new EventSource(
      `${apiDomain}/api/client/${this.game.id}/broadcast`,
      { withCredentials: true }
    );

    this.stream.onopen = () => {
      _self.render("Rival listening");
    };

    this.stream.onmessage = (message) => {
      const messageData = JSON.parse(message.data);

      this.setState(messageData);

      this.render();
      console.log("stream message", messageData);
    };

    this.stream.onerror = (error) => {
      console.log("stream error");
      this.dispatchEvent(
        "error",
        typeof error === "string"
          ? error
          : "Connection issues. Please, reconnect."
      );
    };
  }
}

const style = document.createElement("style");
style.innerHTML = `
  #rival-popup {
    position: fixed;
    let: 0; top: 0; z-index: 3;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center; justify-content: center;
  }

  #rival-popup .content {
    display: flex;
    flex-direction: column; gap: 1rem;
    align-items: center;
    width: fit-content;
    padding: 2rem;
    background: white;
    color: black;
    text-align: center;
  }

  #rival-popup .content button {
    padding: 0.5rem 1.5rem;
    border: 1px solid currentColor;
    background: black;
    color: white;
  }
`;

window.createGameClient = function createGameClient() {
  // set styles
  document.body.append(style);

  return new GameClient();
};

async function auth() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const windowProps = { width: 600, height: 400 };

  windowProps.left = (screenWidth - windowProps.width) / 2;
  windowProps.top = (screenHeight - windowProps.height) / 2;

  // const authWindow = open(
  //   `${apiDomain}/auth`,
  //   "Rival Auth"
  //   // Object.entries(windowProps)
  //   //   .map(([key, value]) => {
  //   //     return `${key}=${value}`;
  //   //   })
  //   //   .join(",")
  // );

  location.href = `${apiDomain}/auth?redirect=${location.href}`;
}

function createId(length = 5) {
  const idKeys = "qwertyuiopasdfghjklzxcvbnm0123456789".split("");

  return new Array(length)
    .fill(null)
    .map(() => {
      const key = randomArrayItem(idKeys);
      const isUppercase = randomBool();

      return isUppercase ? key.toUpperCase() : key;
    })
    .join("");
}

function randomArrayItem(arr) {
  if (!arr?.length) {
    return undefined;
  }

  const length = arr.length;
  const index = Math.floor(randomNumber(0, length)) % length;

  return arr[index];
}

function randomNumber(min = 0, max = 1, floor = false) {
  const value = Math.random() * (max - min) + min;

  if (floor) {
    return Math.floor(value);
  }

  return value;
}

function randomBool() {
  const value = randomNumber();

  return value > 0.5;
}

function connectToStream(url) {
  let stream = this.stream;

  if (stream) {
    stream.close();
  }

  try {
    stream = this.stream = new EventSource(url);

    ["beforeunload", "unload", "popstate", "pagehide"].forEach((event) => {
      window.addEventListener(event, () => {
        stream.close();
      });
    });

    stream.onmessage = (message) => {
      const messageData = JSON.parse(message.data);

      callback(null, messageData);
    };

    stream.onerror = (error) => {
      const errorMessage =
        typeof error === "string"
          ? error
          : "Connection issues. Please, reconnect.";

      callback(errorMessage, null);
    };
  } catch (error) {
    console.warn(error);
  }
}
