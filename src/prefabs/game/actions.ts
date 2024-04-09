import { SessionDTO, SessionStageType } from "core/session/model";
import * as controls from "./controls";
import * as userActions from "core/user/actions";
import { UserDTO } from "core/user/model";
import { GameDTO, GameResultDTO, GameStateDTO } from "prefabs/game/model";
import { TransactionDTO, TransactionPartyType } from "core/transaction/model";
import * as transactionActions from "core/transaction/actions";

// #start User region
export async function connectUser(
  id: SessionDTO["_id"],
  userId,
  params = null
) {
  const [error, session] = await controls.findById(id);

  if (error || !userId) {
    return Promise.reject(error || "Invalid data");
  }

  const { users = [], config } = session;

  if (config?.maxUsers && users?.length >= config.maxUsers) {
    return Promise.reject("Capacity is full");
  }

  if (users.includes(userId)) {
    return session;
  }

  const nextUsers = users.slice();
  nextUsers.push(userId);

  const state = session.state || {};

  const prevState = state[userId] || {};
  state[userId] = { ...prevState, ...params };

  const updated = await controls.updateOne(id, { users: nextUsers, state });

  await userActions.addSession(userId, id);

  return updated;
}

export async function removeUser(id: SessionDTO["_id"], userId) {
  const [error, session] = await controls.findById(id);

  if (error || !userId) {
    return Promise.reject(error || "Invalid data");
  }

  const { users = [], state } = session;

  if (state?.users && state?.users[userId]) {
    delete state.users[userId];
  }

  const nextUsers = users.filter((it) => it !== userId);

  return controls.updateOne(id, { users: nextUsers, state });
}

export async function publishGame(id: SessionDTO["_id"]) {
  return controls.updateOne(id, { stage: SessionStageType.Lobby });
}

export async function setUserOffer(
  sessionId: SessionDTO["_id"],
  userId: UserDTO["_id"],
  value: number,
  autoStart = false
) {
  if (!userId) {
    return Promise.reject("Invalid user");
  }

  const user = await userActions.findUser({ _id: userId }).catch((err) => null);

  if (!user) {
    return Promise.reject("Invalid user");
  }

  if (value && user.assets < value) {
    return Promise.reject("Not enough assets");
  }

  const [error, session] = await controls.findById(sessionId);

  if (error) {
    return Promise.reject(error || "Invalid data");
  }

  if (
    ![SessionStageType.Draft, SessionStageType.Lobby].includes(session.stage)
  ) {
    return Promise.reject("Bets are not accepted anymore");
  }

  // todo: validate user in game
  // todo: validate available user assets

  const usersSessionState = session.state.users || {};

  const usersStatePayload: GameDTO["state"]["users"] = session.users.reduce(
    (accum, userId) => {
      accum[userId] = {
        value: null,
        ...usersSessionState[userId],
      };

      return accum;
    },
    {}
  );

  Object.entries(usersStatePayload).forEach(([id, state]) => {
    if (id === userId) {
      usersStatePayload[id] = {
        ...usersStatePayload[id],
        value,
      };
    } else if (value != null) {
      usersStatePayload[id] = {
        ...usersStatePayload[id],
        value: state.value !== value ? null : value,
      };
    }
  });

  const statePayload: GameStateDTO = {
    ...session.state,
    offer: value || session.state?.offer || 0,
    users: usersStatePayload,
  };

  const [updateError, updated] = await controls
    .updateOne(sessionId, { state: statePayload })
    .then((res) => {
      return [null, res];
    })
    .catch((error) => {
      return [error, null];
    });

  if (updateError) {
    return Promise.reject(updateError);
  }

  if (!autoStart) {
    return updated;
  }

  return startOnReady(updated).catch((error) => {
    console.log("autostart error", error);
    return updated;
  });
}

export async function startOnReady(game: GameDTO) {
  // const { state, users, stage } = game;

  // if (![SessionStageType.Draft, SessionStageType.Lobby].includes(stage)) {
  //   return game;
  // }

  // const usersMap = users.reduce((accum, userId) => {
  //   accum[userId] = { value: null };

  //   return accum;
  // }, {});

  // const allReady = Object.values(usersMap).every(({ ready }) => ready);

  return startGame(game._id);
}

export async function setUserScore(
  sessionId: SessionDTO["_id"],
  userId: UserDTO["_id"],
  value: number
) {
  const [error, session] = await controls.findById(sessionId);

  if (error || !userId) {
    return Promise.reject(error || "Invalid data");
  }

  // todo: validate user in game
  // todo: validate available user assets

  const { state, stage } = session;

  if (![SessionStageType.Active].includes(session.stage)) {
    return Promise.reject("Session is not active");
  }

  if (stage === SessionStageType.Close) {
    return session;
  }

  const usersStatePayload = state?.users || {};
  const currentState = usersStatePayload[userId];

  const nextScore = Number(value) || 0;

  let updated = session;

  if (currentState?.score !== nextScore) {
    usersStatePayload[userId] = {
      ...currentState,
      score: nextScore,
    };

    const statePayload: GameStateDTO = {
      ...state,
      users: usersStatePayload,
    };

    updated = await controls.updateOne(sessionId, { state: statePayload });
  }

  const allSet = Object.values(updated.state.users).every(({ score }) => {
    console.log({ score });
    return score != null;
  });

  if (allSet) {
    return endRound(sessionId);
  }

  return updated;
}

export async function discardGame(id: SessionDTO["_id"]) {
  const [error, session] = await controls.findById(id);

  if (error) {
    return Promise.reject(error);
  }

  const { stage } = session;
  if (![SessionStageType.Draft, SessionStageType.Lobby].includes(stage)) {
    return Promise.reject("Game can't be discarded");
  }

  return controls.updateOne(id, { stage: SessionStageType.Reject });
}

export async function startGame(id: SessionDTO["_id"]) {
  const [error, session] = await controls.findById(id);

  if (error) {
    return Promise.reject(error);
  }

  const { title, stage, users = [], config, state } = session;

  if (![SessionStageType.Draft, SessionStageType.Lobby].includes(stage)) {
    return Promise.reject("Game already was started");
  }

  if (!users?.length || users.length < config?.minUsers) {
    return Promise.reject("Not enough users");
  }

  const offer = state.offer;

  if (!offer) {
    return Promise.reject("No offer set");
  }

  const usersState = state.users;

  // todo: validate offer values
  const allAccepted = Object.values(usersState).every(
    ({ value }) => offer === value
  );

  if (!allAccepted) {
    return Promise.reject("Not all users accepted offer");
  }

  const activeUsers: UserDTO["_id"][] = Object.keys(usersState);

  if (activeUsers?.length < config?.minUsers) {
    return Promise.reject("Not enough users accept offer");
  }
  // todo: create transactions for offers
  const offerTransactions: TransactionDTO[] = await Promise.all(
    activeUsers.map((userId) => {
      return transactionActions.createTransaction({
        value: offer,
        sourceId: userId,
        sourceType: TransactionPartyType.User,
        targetId: id,
        targetType: TransactionPartyType.Session,
        details: `Offer fot "${title}"`,
      });
    })
  );

  // const transactions: TransactionDTO["_id"][] = offerTransactions.map(
  //   ({ _id }) => _id
  // );
  // todo: confirm transactions and validate
  // todo: remove invalid users

  try {
    await controls.updateOne(id, {
      stage: SessionStageType.Active,
    });
  } catch (error) {
    return Promise.reject(
      typeof error === "string"
        ? error
        : error?.message || "Something went wrong. Try again"
    );
  }

  return startRound(id);
}

export async function startRound(id: SessionDTO["_id"]) {
  const [error, session] = await controls.findById(id);

  if (error) {
    return Promise.reject(error || "Invalid data");
  }

  const { stage, state } = session;

  if (![SessionStageType.Active].includes(stage)) {
    return Promise.reject("Game is not active");
  }

  // todo: validate stage and state

  const { rounds } = state;

  const nextRounds = rounds || [];
  nextRounds.push({ winners: null, state: null });

  const statePayload = {
    ...state,
    rounds: nextRounds,
  };

  return controls.updateOne(id, { state: statePayload });
}

export async function endRound(id: SessionDTO["_id"]) {
  const [error, session] = await controls.findById(id);

  if (error) {
    return Promise.reject(error || "Invalid data");
  }

  const { stage, state, config } = session;
  const { rounds } = state;

  if (![SessionStageType.Active].includes(stage)) {
    return Promise.reject("Game is not active");
  }

  if (!rounds?.length) {
    return Promise.reject("None rounds are active");
  }

  const currentRoundIndex = rounds.length - 1;
  const currentRound = rounds[currentRoundIndex];

  if (!currentRound.state) {
    currentRound.state = {
      users: {},
    };
  }

  const usersState = state.users;

  const winners = [];

  const sorted = Object.entries(usersState).sort((a, b) => {
    return b[1].score - a[1].score;
  });
  const maxScore = sorted[0][1].score;
  sorted.forEach(([id, data]) => {
    if (maxScore === data.score) {
      winners.push(id);
    }

    currentRound.state.users[id] = {
      score: data.score,
    };

    state.users[id].score = null;
  });

  currentRound.winners = winners;

  const statePayload = {
    ...state,
    rounds,
  };

  try {
    await controls.updateOne(id, { state: statePayload });
  } catch (error) {
    return Promise.reject(
      typeof error === "string"
        ? error
        : error?.message || "Something went wrong. Try again"
    );
  }

  const isLastRound = config?.maxRounds === rounds.length;

  if (isLastRound) {
    return endGame(id);
  }

  return startRound(id);
}

export async function endGame(id: SessionDTO["_id"]) {
  const [error, session] = await controls.findById(id);

  if (error) {
    return Promise.reject(error || "Invalid data");
  }

  // todo: calculate results
  // todo: create reward transaction(s)

  const { title, state, users, stage } = session;

  if (![SessionStageType.Active].includes(stage)) {
    return Promise.reject("Game is not active");
  }

  const { rounds } = state;

  const userCounter: Record<UserDTO["_id"], number> = {};

  let maxCounter = 0;

  rounds.forEach(({ winners }) => {
    winners?.forEach((userId) => {
      const count = userCounter[userId] || 0;
      const nextCount = count + 1;

      userCounter[userId] = nextCount;

      if (maxCounter < nextCount) {
        maxCounter = nextCount;
      }
    });
  });

  const gameWinners = Object.entries(userCounter)
    .filter(([_, counter]) => {
      return counter === maxCounter;
    })
    .map(([userId]) => userId);

  return resolveGame(session._id, gameWinners);
}

export async function resolveGame(
  id: SessionDTO["_id"],
  winners: UserDTO["_id"][]
) {
  const [error, session] = await controls.findById(id);

  if (error) {
    return Promise.reject(error || "Invalid data");
  }

  const { title, state, users } = session;
  const offer = state.offer;

  const valueTotal = users.length * offer;
  const valuePerWinner = valueTotal / winners.length;

  const resultPayload: GameResultDTO = {
    winners: winners,
    valueTotal,
    valuePerWinner,
  };

  const rewardTransactions: TransactionDTO[] = await Promise.all(
    winners.map((userId) => {
      return transactionActions.createTransaction({
        value: valuePerWinner,
        sourceId: id,
        sourceType: TransactionPartyType.Session,
        targetId: userId,
        targetType: TransactionPartyType.User,
        details: `Reward for winning "${title}"`,
      });
    })
  );

  return controls.updateOne(id, {
    stage: SessionStageType.Close,
    result: resultPayload,
  });
}
