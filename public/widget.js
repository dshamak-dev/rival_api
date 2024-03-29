(() => {
  // src/client/api.ts
  var API_DOMAIN = `{ ENV_PATH }`;
  var TOKEN_DOMAIN = document?.currentScript?.getAttribute("data-domain") || location.host.replace(/(:[0-9]+)$/, "");
  var AUTH_REDIRECT_URL = `${location.href}`;
  function clearAuth() {
    clearCookieByName("rivalAccessToken");
  }
  function getAuthLink(manager) {
    if (!manager) {
      return null;
    }
    const sessionId = manager?.state?.id;
    return `${API_DOMAIN}/auth?sessionId=${sessionId}&action=connect&redirectUrl=${AUTH_REDIRECT_URL}&tokenDomain=${TOKEN_DOMAIN}`;
  }
  async function postUserAction(type, payload) {
    const token = getCookieValue("rivalAccessToken");
    const authentication = token ? `Bearer ${token}` : "";
    return fetch(`${API_DOMAIN}/api/client/actions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: authentication
      },
      credentials: "include",
      body: JSON.stringify({
        type,
        payload
      })
    }).then(async (res) => {
      if (res.status >= 400) {
        throw new Error(await res.text());
      }
      return res;
    });
  }
  function getCookieValue(key) {
    const cookie = document?.cookie;
    if (!cookie) {
      return null;
    }
    const entries = cookie.split(";").reduce((accum, item) => {
      const [key2, value] = item.split("=");
      if (key2) {
        accum[key2] = value;
      }
      return accum;
    }, {});
    return entries[key];
  }
  function clearCookieByName(cookieName) {
    const cookies = document.cookie?.split(";");
    const domain = location.host.replace(/(:[0-9]+)$/, "");
    for (const it of cookies) {
      const [key, value] = it.split("=");
      if (key === cookieName) {
        const itemRecord = `${key}=${value}; expires=${(/* @__PURE__ */ new Date(
          0
        )).toUTCString()}; path=/; domain=.${domain}`;
        console.log(itemRecord);
        document.cookie = itemRecord;
      }
    }
  }
  function connectEventSouce(sessionId, onMessage, onError) {
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

  // src/client/style.ts
  var style_default = `<style>
  #rival-widget {
    position: fixed;
    z-index: 5;
    right: 0;
    top: 0;

    font-size: 14px;
    line-height: 1;

    display: none;

    background: black;
    color: white;
    border: 1px solid currentColor;
  }
  #rival-widget.visible {
    display: block;
  }

  #rival-popup {
    position: fixed;
    z-index: 6;
    left: 0;
    top: 0;
    width: 100%;
    height: 100vh;

    display: none;
    align-items: center;
    justify-content: center;

    font-size: 18px;
    line-height: 1;

    background: rgba(0,0,0, 0.7);
  }
  #rival-popup.visible {
    display: flex;
  }
  #rival-popup .content {
    position: relative;
    padding: 2rem 3rem;
    background: white;
    color: black;
    border: 3px solid currentColor;

    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  #rival-popup .content #sign-out {
    position: absolute;
    top: 0;
    left: 0;
    padding: 0.5rem;
    font-size: 0.6rem;
    cursor: pointer;
  }
  #rival-popup .content #sign-out:hover {
    color: orangered;
  }

  #rival-popup .content #close {
    --size: 1.5rem;

    position: absolute;
    top: 0;
    right: 0;
    top: calc(var(--size) / -2);
    right: calc(var(--size) / -2);
    width: var(--size);
    height: var(--size);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: black;
    color: white;
    border: 1px solid black;
  }
  #rival-popup .content #close:hover {
    color: orangered;
  }

  a {
    text-decoration: underline;
  }

  button,
  .button {
    --bg: 0,0,0;
    --text: 255,255,255;
  
    display: block;
    color:  rgba(var(--text));
    border: 1px solid currentColor;
    padding: 0.5rem 1.5rem;
    background: rgba(var(--bg));
  
    text-transform: capitalize;
    text-decoration: none;
    text-align: center;
  }
  button.secondary,
  .button.secondary {
    --text: 0,0,0;
    --bg: 255,255,255;
  }
  @media (hover: hover) {
    button:not([disabled]):hover,
    .button:not([disabled]):hover {
      box-shadow: 0 4px 4px 0 black;
      transform: translateY(-2px);
      cursor: pointer;
    }
  }
  
  button:not([disabled]):active,
  .button:not([disabled]):active {
    filter: contrast(0.5);
  }

  .number {
    font-family: sans-serif;
  }
  input.number {
    border: 0;
    text-align: center;
    padding: 0;
    width: 100%;
    max-width: 11rem;
    margin: 0 auto;
    outline: 0;
  }

  .text-xs {
    font-size: 0.6rem;
  }
  .text-base {
    font-size: 1rem;
  }
  .text-lg {
    font-size: 1.2rem;
  }
  .text-xl {
    font-size: 1.6rem;
  }
  .text-2xl {
    font-size: 3.2rem;
  }

  .field {
    display: flex;
    flex-direction: column;

    text-align: center;
  }
  .field .label {
    font-size: 0.6rem;
  }

  .error {
    color: orangered;
  }

  .text-center {
    text-align: center;
  }

  .flex {
    display: flex;
  }
  .flex-col {
    flex-direction: column;
  }
  
  .justify-center {
    justify-content: center;
  }
  
  .items-center {
    align-items: center;
  }
  .gap-2 {
    gap: 0.5rem;
  }
  .gap-4 {
    gap: 1rem;
  }
  .gap-8 {
    gap: 2rem;
  }

  .grow {
    flex-grow: 1;
  }
</style>`;

  // src/client/utils.ts
  function getFormValue(formEl, key) {
    const formData = new FormData(formEl);
    return formData.get(key);
  }

  // src/client/view.ts
  var RivalsView = class extends HTMLElement {
    constructor() {
      super();
      this.popup = document.createElement("div");
      this.popup.id = "rival-popup";
      this.widget = document.createElement("div");
      this.widget.id = "rival-widget";
      this.shadow = this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.shadow.innerHTML = `${style_default}`;
      this.shadow.append(this.widget);
      this.shadow.append(this.popup);
    }
    update() {
      this.widget.classList.remove("visible");
      this.widget.innerHTML = "";
      if (!this.manager?.state?.id) {
        return;
      }
      this.widget.classList.add("visible");
      const isLoggedIn = this.manager.user?.logged;
      const authUrl = getAuthLink(this.manager);
      if (!isLoggedIn) {
        this.widget.innerHTML = `<a class="button primary" href="${authUrl}">join the rival</a>`;
      } else {
        this.widget.onclick = this.showDetails.bind(this);
        this.widget.innerHTML = `<button>open details</button>`;
      }
      const isVisible = this.popup.classList.contains("visible");
      if (isVisible) {
        let popupContent = this.popup.querySelector("#popup-content");
        renderDetails.call(this, this.manager, popupContent);
      }
    }
    setContent(content) {
      if (this.shadow) {
        this.widget.innerHTML = content;
      }
    }
    showDetails() {
      this.popup.classList.add("visible");
      this.popup.onclick = this.hideDetails.bind(this);
      let popupContent = this.popup.querySelector("#popup-content");
      if (!popupContent) {
        popupContent = document.createElement("div");
        popupContent.id = "popup-content";
        popupContent.classList.add("content");
        popupContent.onclick = (e) => e.stopPropagation();
        this.popup.append(popupContent);
      }
      renderDetails.call(this, this.manager, popupContent);
    }
    hideDetails() {
      this.popup.classList.remove("visible");
      this.popup.innerHTML = "";
    }
  };
  customElements.define("rivals-view", RivalsView);
  function createView(manager) {
    const el = document.createElement("rivals-view");
    el.manager = manager;
    return el;
  }
  function renderDetails(manager, targetEl) {
    if (!manager?.state || !targetEl) {
      return;
    }
    const isLoggedIn = manager.user?.logged;
    const authUrl = getAuthLink(manager);
    const { offer, stage, user, total } = manager.state;
    const gamePending = [0 /* Draft */, 1 /* Lobby */].includes(
      stage
    );
    const canChange = isLoggedIn && gamePending;
    const hasSameBid = offer === user?.value;
    let gameStageLabel = null;
    if (stage === 2 /* Active */) {
      gameStageLabel = "in progress";
    } else if (stage === 3 /* Close */) {
      gameStageLabel = "game ended";
    }
    const errorMessage = manager.error?.message || manager.error;
    const gameValue = gamePending ? offer || 0 : total;
    const gameValueLabel = gamePending ? "current offer" : "total prize";
    targetEl.innerHTML = "";
    targetEl.innerHTML = `
      <div class="field">
        <strong class="value text-lg">${manager.connectionId}</strong>
        <label class="label">game tag</label>
      </div>
      ${isLoggedIn ? `<div class="field">
              <strong class="value">${manager.user.email}</strong>
              <label class="label">current user</label>
            </div>` : ""}
      <div class="field">
        ${canChange ? `<form id="offer-form">
                <input 
                  required 
                  name="value" 
                  id="offer-input" 
                  type="number" 
                  class="number value text-2xl" 
                  min="1" 
                  step="1" 
                  value=${offer}
                />
            </form>` : `<strong class="value text-2xl number">${gameValue}</strong>`}
        <label class="label">${gameValueLabel}</label>
      </div>
      ${gameStageLabel ? `<div class="text-center"><label>${gameStageLabel}</label></div>` : ""}
      ${errorMessage ? `<div class="error text-xs text-center">${errorMessage}</div>` : ""}
    `;
    const closeEl = document.createElement("span");
    closeEl.id = "close";
    closeEl.innerText = "x";
    closeEl.onclick = () => {
      this.hideDetails();
    };
    targetEl.prepend(closeEl);
    if (!isLoggedIn) {
      if (authUrl) {
        const authLinkEl = document.createElement("a");
        authLinkEl.classList.add("button");
        authLinkEl.innerText = "join";
        authLinkEl.setAttribute("href", authUrl);
        targetEl.append(authLinkEl);
      }
      return;
    }
    if (!canChange) {
      return;
    }
    const leaveEl = document.createElement("a");
    leaveEl.id = "sign-out";
    leaveEl.innerText = "leave";
    leaveEl.onclick = () => {
      this.hideDetails();
      this.manager.leave();
    };
    targetEl.prepend(leaveEl);
    const form = targetEl.querySelector("#offer-form");
    if (form) {
      form.onsubmit = (event) => {
        event.preventDefault();
        const value = getFormValue(event.target, "value");
        manager.setPlayerOffer(value);
      };
    }
    const controlsEl = document.createElement("div");
    controlsEl.classList.add(..."flex gap-2 justify-between".split(" "));
    const acceptBtn = document.createElement("button");
    acceptBtn.innerText = hasSameBid ? "change" : "accept";
    acceptBtn.onclick = () => {
      const value = getFormValue(form, "value");
      manager.setPlayerOffer(value);
    };
    controlsEl.append(acceptBtn);
    const rejectBtn = document.createElement("button");
    rejectBtn.classList.add("secondary");
    rejectBtn.innerText = "reject";
    rejectBtn.onclick = () => {
      manager.setPlayerOffer(null);
    };
    controlsEl.append(rejectBtn);
    targetEl.append(controlsEl);
  }

  // src/client/model.ts
  var TEMPLATE_ID = document?.currentScript?.getAttribute("data-template");
  var RivalManager2 = class {
    constructor() {
      this.el = createView(this);
      this.templateId = TEMPLATE_ID;
      document.body.append(this.el);
    }
    start(connectionId, playerId) {
      this.connectionId = connectionId;
      this.playerId = playerId;
      this.setState({ loading: true });
      this.connect();
    }
    connect() {
      if (!this.templateId) {
        console.warn("invalid template");
        return;
      }
      this.dispatchAction("connect", {
        templateId: this.templateId,
        linkedId: this.playerId
      }).then(async (game) => {
        if (!game || ![0 /* Draft */, 1 /* Lobby */].includes(game?.stage)) {
          return game;
        }
        this.listen(game.id);
        return game;
      });
    }
    listen(sessionId) {
      this.stopListening();
      this.eventSource = connectEventSouce(sessionId, (message) => {
        this.setState(message);
      }, (error) => {
        console.warn(error);
      });
    }
    stopListening() {
      if (this.eventSource) {
        this.eventSource.close();
      }
    }
    leave() {
      this.dispatchAction("disconnect").then(() => {
        clearAuth();
      });
      this.setState({ ...this.state, user: null });
    }
    setState(payload) {
      this.state = payload;
      this.user = { logged: false };
      if (payload?.user) {
        this.user.email = payload.user.email;
        this.user.id = payload.user.id;
        this.user.logged = true;
      }
      this.el.update();
      if (payload.offer && this.user && this.user?.value != payload.offer) {
        this.el.showDetails();
      }
    }
    setPlayerOffer(payload) {
      const value = payload != null ? Math.floor(payload) : payload;
      if (value !== null && value <= 0) {
        this.setError("Only integer more than 0 accepted");
        return this.el.update();
      }
      this.dispatchAction("offer", { value }).then((res) => {
        this.el.hideDetails();
      });
    }
    setPlayerScore(scoreValue) {
      this.dispatchAction("score", { score: scoreValue });
    }
    end() {
      this.eventSource?.close();
    }
    on() {
    }
    dispatchAction(type, payload = {}) {
      this.setError(null);
      return postUserAction(type, {
        ...payload,
        linkedId: this.playerId,
        tag: this.connectionId
      }).then((res) => res.json()).then(async (game) => {
        this.setState(game);
        return game;
      }).catch((error) => {
        this.setError(error);
        this.el.update();
        return Promise.reject(error);
      });
    }
    setError(error) {
      this.error = error;
    }
  };

  // src/client/index.ts
  window.RIVALS = Object.freeze({
    create: function create() {
      return new RivalManager2();
    }
  });
})();
