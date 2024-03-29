import { getAuthLink } from "./api";
import { GameStageType, RivalManager } from "./model";
import style from "./style";
import { getFormValue } from "./utils";

class RivalsView extends HTMLElement {
  manager;
  shadow;
  popup;
  widget;

  constructor() {
    super();
    this.popup = document.createElement("div");
    this.popup.id = "rival-popup";

    this.widget = document.createElement("div");
    this.widget.id = "rival-widget";

    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadow.innerHTML = `${style}`;

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
}

customElements.define("rivals-view", RivalsView);

export function createView(manager: RivalManager) {
  const el: RivalsView = document.createElement("rivals-view") as RivalsView;
  el.manager = manager;

  return el;
}

function renderDetails(manager: RivalManager, targetEl) {
  if (!manager?.state || !targetEl) {
    return;
  }

  const isLoggedIn = manager.user?.logged;
  const authUrl = getAuthLink(manager);

  const { offer, stage, user, total } = manager.state;

  const gamePending = [GameStageType.Draft, GameStageType.Lobby].includes(
    stage
  );
  const canChange = isLoggedIn && gamePending;
  const hasSameBid = offer === user?.value;

  let gameStageLabel: string | null = null;

  if (stage === GameStageType.Active) {
    gameStageLabel = "in progress";
  } else if (stage === GameStageType.Close) {
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
      ${
        isLoggedIn
          ? `<div class="field">
              <strong class="value">${manager.user.email}</strong>
              <label class="label">current user</label>
            </div>`
          : ""
      }
      <div class="field">
        ${
          canChange
            ? `<form id="offer-form">
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
            </form>`
            : `<strong class="value text-2xl number">${gameValue}</strong>`
        }
        <label class="label">${gameValueLabel}</label>
      </div>
      ${
        gameStageLabel
          ? `<div class="text-center"><label>${gameStageLabel}</label></div>`
          : ""
      }
      ${
        errorMessage
          ? `<div class="error text-xs text-center">${errorMessage}</div>`
          : ""
      }
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

  // const hasBid = user?.value != null;

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
