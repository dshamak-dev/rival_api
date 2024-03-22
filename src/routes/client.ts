import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import repository from "core/session/repository";
import * as templateActions from "core/template/actions";
import { decodeUserToken } from "core/user/actions";
import { connectUser, setUserOffer, setUserScore } from "prefabs/game/actions";
import { addListener, removeListener } from "core/session/oberver";
import { SessionDTO, SessionStageType } from "core/session/model";

const router = express.Router();
const rootPath = "/client";

router.use(cookieParser());

const scriptPath = path.join(__dirname, "../client/index.js");

router.get(`${rootPath}/`, (req, res) => {
  res.sendFile(scriptPath);
});

router.post(`${rootPath}/actions`, async (req, res) => {
  const { payload, type } = req.body;
  const { tag, templateId } = payload;

  let session = await repository.findOne({ tag });

  if (!session && !templateId) {
    return res.end("Invalid data").status(400);
  }

  const token = req.cookies?.rivalAccessToken;
  const decoded: any = decodeUserToken(token);
  const userId = decoded?.id;
  const inGame = userId && session && session.users?.includes(userId);
  const sessionId = session?._id;

  switch (type) {
    case "connect": {
      if (!session) {
        session = await templateActions.createFromTemplate(templateId, { tag });
      }

      if (decoded?.id) {
        await connectUser(session._id, decoded?.id)
          .then((res) => {
            session = res;
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

      await setUserOffer(sessionId, userId, Number(payload.value) || null, true)
        .then((updated) => {
          session = updated;
        })
        .catch((error) => {
          console.log("offer error", error);
        });
      break;
    }
    case "score": {
      if (!inGame) {
        break;
      }

      try {
        await setUserScore(
          sessionId,
          userId,
          Number(payload.score) || null
        ).then((updated) => {
          session = updated;
        });
      } catch (error) {
        console.log("score error", error);
      }
      break;
    }
  }

  if (session) {
    const payload = getGameUserState(session, decoded);

    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Authorization, Content-Type, Accept"
    );
    return res.json(payload).status(200);
  }

  return res.end("Invalid data").status(400);
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

  addListener(sessionId, handleEvent);

  res.once("close", () => {
    removeListener(sessionId, handleEvent);
  });

  Object.entries({
    "Access-Control-Allow-Origin": req.headers.origin,
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
  let userState = user
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
    logged: user && users?.includes(user?.id),
    userState,
    stage,
  };

  if (stage === SessionStageType.Close) {
    userState.winState = result?.winners?.includes(userState.id);
    userState.total = userState.winState ? result.valuePerWinner : 0;
  }

  return payload;
}
