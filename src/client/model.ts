import { clearAuth, connectEventSouce, postUserAction } from "./api";
import { createView } from "./view";

const TEMPLATE_ID = document?.currentScript?.getAttribute("data-template");

export enum GameStageType {
  Draft = 0,
  Lobby = 1,
  Active = 2,
  Close = 3,
  Reject = 4,
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
  errors: any[] = [];

  constructor() {
    this.el = createView(this);
    this.templateId = TEMPLATE_ID;

    document.body.append(this.el);
  }

  connect(connectionId, playerId, observer = true) {
    this.playerId = playerId;
    this.connectionId = connectionId;

    if (!this.templateId) {
      this.setError("invalid template");
      return;
    }

    if (!this.playerId || !this.connectionId) {
      this.setError("invalid connection data");
      return;
    }

    this.setState({ loading: true });

    return this.dispatchAction("connect", {
      templateId: this.templateId,
      linkedId: this.playerId,
    }).then(async (game) => {
      if (
        !game ||
        ![GameStageType.Draft, GameStageType.Lobby].includes(game?.stage)
      ) {
        return game;
      }

      if (observer) {
        this.listen();
      }

      return game;
    });
  }

  start() {
    return this.dispatchAction("start");
  }

  discard() {
    return this.dispatchAction("discard").then(() => {
      this.stopListening();
    });
  }

  listen() {
    const gameId = this.state?.id;

    this.stopListening();

    if (!gameId) {
      return;
    }

    this.eventSource = connectEventSouce(
      gameId,
      (message) => {
        this.setState(message);
      },
      (error) => {
        console.warn(error);
      }
    );
  }

  stopListening() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  leave() {
    this.stopListening();
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

    const userValue = payload.user?.value;
    const offer = payload.offer;

    switch (payload?.stage) {
      case GameStageType.Draft:
      case GameStageType.Lobby: {
        if (offer && userValue != offer) {
          this.el.showDetails();
        }
        break;
      }
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
    if (error) {
      this.errors.push(error);

      // console.warn(error);
    }
  }
}
