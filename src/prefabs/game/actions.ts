import { SessionDTO, SessionStageType } from "core/session/model";
import * as controls from "./controls";
import * as userActions from "core/user/actions";
import { UserDTO } from "core/user/model";
import { GameResultDTO, GameStateDTO } from "prefabs/game/model";
import { TransactionDTO, TransactionPartyType } from "core/transaction/model";
import * as transactionActions from "core/transaction/actions";

// #start User region
export async function connectUser(id: SessionDTO["_id"], userId) {
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

  const updated = await controls.updateOne(id, { users: nextUsers });

  await userActions.addSession(userId, id);

  return updated;
}

export async function removeUser(id: SessionDTO["_id"], userId) {
  const [error, session] = await controls.findById(id);

  if (error || !userId) {
    return Promise.reject(error || "Invalid data");
  }

  const { users = [] } = session;

  const nextUsers = users.filter((it) => it !== userId);

  return controls.updateOne(id, { users: nextUsers });
}

export async function publishGame(id: SessionDTO["_id"]) {
  return controls.updateOne(id, { stage: SessionStageType.Lobby });
}

export async function setUserOffer(
  sessionId: SessionDTO["_id"],
  userId: UserDTO["_id"],
  value: number
) {
  const [error, session] = await controls.findById(sessionId);

  if (error || !userId || !value) {
    return Promise.reject(error || "Invalid data");
  }

  // todo: validate user in game
  // todo: validate available user assets

  const { state } = session;

  const usersStatePayload = state?.users || {};

  usersStatePayload[userId] = {
    ...usersStatePayload[userId],
    value,
  };

  const statePayload: GameStateDTO = {
    ...state,
    offer: value,
    users: usersStatePayload,
  };

  return controls.updateOne(sessionId, { state: statePayload });
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

export async function endRound(
  id: SessionDTO["_id"],
  winners: UserDTO["_id"][]
) {
  const [error, session] = await controls.findById(id);

  if (error || !winners?.length) {
    return Promise.reject(error || "Invalid data");
  }

  const { stage, state, config } = session;
  const { rounds, users } = state;

  if (![SessionStageType.Active].includes(stage)) {
    return Promise.reject("Game is not active");
  }

  if (!rounds?.length) {
    return Promise.reject("None rounds are active");
  }

  const currentRoundIndex = rounds.length - 1;
  const currentRound = rounds[currentRoundIndex];

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

  const offer = state.offer;

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
  const valueTotal = users.length * offer;
  const valuePerWinner = valueTotal / gameWinners.length;

  const resultPayload: GameResultDTO = {
    winners: gameWinners,
    valueTotal,
    valuePerWinner,
  };

  const rewardTransactions: TransactionDTO[] = await Promise.all(
    gameWinners.map((userId) => {
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

  // const transactionsPayload = transactions.concat(
  //   rewardTransactions.map(({ _id }) => _id)
  // );

  return controls.updateOne(id, {
    stage: SessionStageType.Close,
    result: resultPayload,
  });
}
