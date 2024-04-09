import express from "express";
import cookieParser from "cookie-parser";
import repository from "core/session/repository";
import * as templateActions from "core/template/actions";
import {
  decodeUserToken,
  findInSession,
  getUserCredentials,
} from "core/user/actions";
import {
  connectUser,
  discardGame,
  removeUser,
  resolveGame,
  setUserOffer,
  setUserScore,
  startGame,
  startOnReady,
} from "prefabs/game/actions";
import { addListener, removeListener } from "core/broadcast/oberver";
import { SessionDTO, SessionStageType } from "core/session/model";

const router = express.Router();
const rootPath = "/client";

router.use(cookieParser());

router.post(`${rootPath}/actions`, async (req, res) => {
  const { payload, type } = req.body;
  const { tag, templateId, linkedId } = payload;

  let session = await repository.findOne({ tag });

  res.set({
    "Access-Control-Allow-Origin": req.headers.origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Credentials",
    "Access-Control-Max-Age": 86400,
  });

  if (!session && !templateId) {
    return res.end("Invalid data").status(400);
  }

  const decoded: any = getUserCredentials(req);
  const userId = decoded?.id;
  const inGame = userId && session && session.users?.includes(userId);
  const sessionId = session?._id;

  let actionError = null;

  switch (type) {
    case "connect": {
      if (!session) {
        session = await templateActions
          .createFromTemplate(templateId, { tag })
          .catch((err) => null);
      }

      if (session && decoded?.id) {
        await connectUser(session._id, decoded?.id, { linkedId })
          .then((res) => {
            session = res;
          })
          .catch((error) => {
            console.log(error);
          });
      }
      break;
    }
    case "disconnect": {
      if (!session) {
        break;
      }

      const userQuery = {
        id: decoded?.id,
        linkedId: linkedId,
      };

      const targetUserId = findInSession(session, userQuery)?.id;

      if (targetUserId) {
        await removeUser(session._id, targetUserId)
          .then((res) => {
            session = res;
            console.log("discommect result", res);
          })
          .catch((error) => {
            console.log(error);
          });
      }
      break;
    }
    case "offer": {
      if (!inGame) {
        break;
      }

      await setUserOffer(
        sessionId,
        userId,
        Number(payload.value) || null,
        false
      )
        .then((updated) => {
          session = updated;
        })
        .catch((error) => {
          actionError = error;
          console.log("offer error", error);
        });
      break;
    }
    case "start": {
      if (!inGame) {
        break;
      }

      await startGame(session?._id)
        .then((updated) => {
          session = updated;
        })
        .catch((error) => {
          actionError = error;
        });
      break;
    }
    case "discard": {
      if (!inGame) {
        break;
      }

      await discardGame(session?._id)
        .then((updated) => {
          session = updated;
        })
        .catch((error) => {
          actionError = error;
        });
      break;
    }
    case "score": {
      if (!inGame) {
        break;
      }

      try {
        const targetuserId = findInSession(session, {
          linkedId,
          id: userId,
        })?.id;

        await setUserScore(
          sessionId,
          targetuserId,
          Number(payload.score) || null
        ).then((updated) => {
          session = updated;
        });
      } catch (error) {
        console.log("score error", error);
      }
      break;
    }
    case "resolve": {
      try {
        const linkedUsers = Object.entries(session.state).reduce((acc, [id, value]: any) => {
          if (value?.linkedId){
            acc[value.linkedId] = id;
          }

          return acc;
        }, {});
        const sessionWinners = payload.winners?.map(({ linkedId }) => {
          return linkedUsers[linkedId];
        });

        await resolveGame(sessionId, sessionWinners).then((updated) => {
          session = updated;
        });
      } catch (error) {}
      break;
    }
    default: {
      session = null;
    }
  }

  if (!actionError && session) {
    const payload = getGameUserState(session, decoded);

    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Content-Length, X-Requested-With"
    );
    return res.json(payload).status(200);
  }

  return res.status(400).end(actionError || "Invalid data");
});

router.get(`${rootPath}/:sessionId/broadcast`, async (req, res) => {
  const token = req.cookies?.rivalAccessToken;
  const decoded: any = decodeUserToken(token);

  const sessionId = req.params.sessionId;

  if (!sessionId) {
    return res.json({ message: "No access" }).status(400);
  }

  const encoder = new TextEncoder();

  function handleEvent(data: SessionDTO) {
    const payload = getGameUserState(data, decoded);

    res.write(encoder.encode("data: " + JSON.stringify(payload) + "\n\n"));
  }

  addListener("session", sessionId, handleEvent);

  res.once("close", () => {
    removeListener(sessionId, handleEvent);
  });

  Object.entries({
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "text/event-stream; charset=utf-8",
    Connection: "keep-alive",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    "Content-Encoding": "none",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Authorization, Content-Type, Accept",
  }).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
});

export default router;

function getGameUserState(session, user = null) {
  const { _id, users, state, stage, result } = session;

  const inSession = findInSession(session, user)?.id != null;

  let userState =
    inSession && user
      ? {
          id: user.id,
          email: user.email,
          value: null,
          winState: null,
          total: null,
        }
      : null;

  if (state?.users && user?.id) {
    userState.value = state?.users[user?.id]?.value;
  }

  const payload = {
    id: _id,
    offer: state?.offer || 0,
    total: users?.length * state?.offer,
    logged: user && users?.includes(user?.id),
    user: userState,
    stage,
  };

  if (stage === SessionStageType.Close) {
    userState.winState = result?.winners?.includes(userState.id);
    userState.total = userState.winState ? result.valuePerWinner : 0;
  }

  return payload;
}
