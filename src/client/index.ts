import { RivalManager } from "./model";

declare global {
  interface Window {
    RIVALS: {
      create: () => RivalManager;
    };
  }
}

window.RIVALS = Object.freeze({
  create: function create() {
    return new RivalManager();
  },
});
