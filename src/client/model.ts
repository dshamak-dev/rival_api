import { clearAuth, connectEventSouce, postUserAction } from "./api";
import { createView } from "./view";

const TEMPLATE_ID = document?.currentScript?.getAttribute("data-template");

export enum GameStageType {
  Draft = 0,
  Lobby = 1,
  Active = 2,
  Close = 3,
}

export class RivalManager {
  el;
  templateId;
  connectionId;
  playerId;
  user;
  eventSource;
  state;
  error;

  constructor() {
    this.el = createView(this);
    this.templateId = TEMPLATE_ID;

    document.body.append(this.el);
  }

  start(connectionId, playerId) {
    this.connectionId = connectionId;
    this.playerId = playerId;

    // todo: fetch game api
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
      linkedId: this.playerId,
    }).then(async (game) => {
      if (!game || ![GameStageType.Draft, GameStageType.Lobby].includes(game?.stage)) {
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

    // console.log("set state", payload);
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
      this.setError('Only integer more than 0 accepted');
      return this.el.update();
    }

    this.dispatchAction("offer", { value }).then(res => {
      this.el.hideDetails();
    });
  }

  setPlayerScore(scoreValue) {
    this.dispatchAction("score", { score: scoreValue });
  }

  end() {
    this.eventSource?.close();
  }

  on() {}

  dispatchAction(type, payload = {}) {
    this.setError(null);
    return postUserAction(type, {
      ...payload,
      linkedId: this.playerId,
      tag: this.connectionId,
    })
      .then((res) => res.json())
      .then(async (game) => {
        this.setState(game);

        return game;
      })
      .catch((error) => {
        this.setError(error);
        this.el.update();

        return Promise.reject(error);
      });
  }

  setError(error) {
    this.error = error;
  }
}
