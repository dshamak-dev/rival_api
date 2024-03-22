class GameClient {
  constructor(props) {
    Object.assign(this, props);
  }
}

function createClient(props) {
  return new GameClient(props);
}