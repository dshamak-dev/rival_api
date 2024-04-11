import { TransactionDTO } from "core/transaction/model";
import repository from "./repository";
import { SessionDTO, SessionPayloadDTO, SessionType } from "core/session/model";
import * as userActions from "core/user/actions";
import { randomId } from "utils/random.utils";
import * as gameControls from "prefabs/game/controls";
import * as betActions from "prefabs/bet/actions";
import { GamePayloadDTO } from "prefabs/game/model";

export async function addTransactions<T>(
  id: SessionDTO["_id"],
  transactions: TransactionDTO["_id"][]
): Promise<T> {
  return repository.addToArray({ _id: id }, "transactions", transactions);
}

export async function createSession(payload: SessionPayloadDTO) {
  const { ownerId, type, ...other } = payload;

  if (!ownerId) {
    return Promise.reject("Invalid user");
  }

  const tag = payload.tag
    ? payload.tag.trim().replace(/\s+/g, "-")
    : randomId(8);

  let res = null;

  switch (Number(type)) {
    case SessionType.Bet: {
      res = await betActions.create({ ...payload, tag, ownerId } as any);
      break;
    }
    case SessionType.Game: {
      res = await gameControls.create(payload as GamePayloadDTO);
    }
    case SessionType.Quiz: {
      res = await repository.create({ ...payload, tag, ownerId });
      break;
    }
  }

  if (res && ownerId) {
    await userActions.addSession(ownerId as any, res._id);
  }

  return res;
}

export async function editSession(
  id: SessionDTO["_id"],
  payload: SessionPayloadDTO
) {
  if (!id) {
    return Promise.reject("Invalid sesison");
  }

  const { ownerId, type, ...other } = payload;

  const tag = payload.tag
    ? payload.tag.trim().replace(/\s+/g, "-")
    : randomId(8);

  let res = null;

  switch (Number(type)) {
    case SessionType.Bet: {
      res = await betActions.edit(id, { ...payload, tag, ownerId } as any);
      break;
    }
    case SessionType.Game: {
      res = await gameControls.edit(id, payload as GamePayloadDTO);
    }
  }

  return res;
}

export async function resolveUserAction(sessionId, userId, action) {
  const session = await repository
    .findOne({ _id: sessionId })
    .catch((error) => null);

  if (!session){
    return Promise.reject('Invalid session');
  }

  switch (session.type) {
    case SessionType.Bet: {
      return betActions.resolveUserAction(session, userId, action);
    }
  }

  return null;
}
