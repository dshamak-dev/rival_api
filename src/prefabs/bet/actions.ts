import {
  SessionDTO,
  SessionPayloadDTO,
  SessionStageType,
} from "core/session/model";
import { BetPayloadDTO } from "prefabs/bet/model";
import * as sessionControls from "core/session/controls";
import { randomUUID } from "crypto";
import * as userActions from "core/user/actions";
import * as betSupport from "./support";
import repository from "core/session/repository";

export async function create(payload: BetPayloadDTO) {
  const body = await parse(payload);

  return sessionControls.create<SessionPayloadDTO, SessionDTO>(body);
}

export async function edit(id: SessionDTO["_id"], payload: BetPayloadDTO) {
  const body = await parse(payload);

  return sessionControls.updateOne({ _id: id }, body);
}

export async function parse(
  payload: BetPayloadDTO
): Promise<SessionPayloadDTO | null> {
  if (!payload) {
    return null;
  }

  const { options, ...other } = payload;

  let _nextOptions =
    typeof options === "string" ? JSON.parse(options) : options;

  if (!Array.isArray(_nextOptions) || !_nextOptions.length) {
    return Promise.reject("invalid options");
  }

  const values = generateUUIDList(_nextOptions.length);

  _nextOptions = _nextOptions
    .filter((it) => !!it?.text)
    .map(({ text }, index) => {
      return {
        text,
        value: values[index],
      };
    });

  const body: SessionPayloadDTO = {
    ...other,
    config: {
      options: _nextOptions,
    },
  };

  return body;
}

function generateUUIDList(length: number) {
  const _arr: string[] = [];

  function createAndAppendId() {
    const _id = generateOptionId();

    if (_arr.includes(_id)) {
      return createAndAppendId();
    }

    _arr.push(_id);
  }

  for (let i = 0; i < length; i++) {
    createAndAppendId();
  }

  return _arr;
}

function generateOptionId() {
  return randomUUID().split("-")[0];
}

export async function resolveUserAction(session, userId, action) {
  if (!session) {
    return Promise.reject("Invalid session");
  }

  switch (action.type) {
    case "bet": {
      return setBet(session, userId, action.payload);
    }
    case "cancel":
    case "leave": {
      return removeBet(session, userId);
    }
    case "start": {
      return start(session, userId);
    }
    case "end": {
      return end(session, userId, action.payload);
    }
  }

  return null;
}

export async function setBet(session, userId, payload) {
  if (!session) {
    return Promise.reject("Invalid session");
  }

  if (!userId) {
    return Promise.reject("Invalid user");
  }

  const { state, users } = session;
  const { option, value } = payload;

  const [assetsError, user] = await userActions
    .validateUserAssets(userId, value)
    .then((user) => [null, user])
    .catch((error) => [error?.message || error, null]);

  if (assetsError){
    return Promise.reject(assetsError);
  }

  if (!users?.includes(userId)) {
    await sessionControls.addUser(session._id, userId).catch((err) => null);

    await userActions.addSession(userId, session._id);
  }

  const [error, updated] = await sessionControls
    .setUserState(session._id, userId, { option, value: Number(value) })
    .then((res) => [null, res])
    .catch((err) => [err, null]);

  if (error) {
    return Promise.reject(error);
  }

  return updated;
}

export async function removeBet(session, userId) {
  if (!session) {
    return Promise.reject("Invalid session");
  }

  if (!userId) {
    return Promise.reject("Invalid user");
  }

  const { users } = session;

  if (users?.includes(userId)) {
    await sessionControls.removeUser(session._id, userId).catch((err) => null);

    await userActions.removeSession(userId, session._id);
  }

  const [error, updated] = await sessionControls
    .setUserState(session._id, userId, null)
    .then((res) => [null, res])
    .catch((err) => [err, null]);

  if (error) {
    return Promise.reject(error);
  }

  return updated;
}

export async function start(session, userId) {
  if (!session) {
    return Promise.reject("Invalid session");
  }

  if (session.ownerId !== userId) {
    return Promise.reject("No permission");
  }

  const { users, config } = session;
  const minUsers = config?.minUsers || 2;

  if (users?.length < minUsers) {
    return Promise.reject(`Not enough users. Should be ${minUsers} or more`);
  }

  // validate bets
  // calculate summary
  const summary = betSupport.calculateSummary(session);
  // create transactions
  const transactions = await betSupport.createBidTransactions(
    session._id,
    session.state.users,
    `Bid in ${session.title}`
  );

  // set active stage
  return repository.model.findOneAndUpdate(
    { _id: session._id },
    { $set: { stage: SessionStageType.Active, "state.summary": summary } },
    { upsert: true, new: true }
  );
}

export async function end(session, userId, payload) {
  if (!session) {
    return Promise.reject("Invalid session");
  }

  if (session.ownerId !== userId) {
    return Promise.reject("No permission");
  }

  if (!payload.answer) {
    return Promise.reject("Invalid answer");
  }

  // find and set winner(s)
  const winners = betSupport.getWinners(session, payload.answer);

  // set answer to session result
  const result = {
    answer: payload.answer,
    winners,
  };

  // create reward transaction(s)
  const transactions = await betSupport.createRewardTransactions(
    session._id,
    winners,
    `Reward in ${session.title}`
  );

  // set end stage
  return repository.model.findOneAndUpdate(
    { _id: session._id },
    { $set: { stage: SessionStageType.Close, result: result } },
    { upsert: true, new: true }
  );
}
