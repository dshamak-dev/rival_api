import express from "express";
import cors from "cors";
import { addListener, removeListener } from "core/broadcast/oberver";
import { SessionDTO, SessionType } from "core/session/model";
import repository from "core/session/repository";
import * as templateActions from "core/template/actions";
import {
  createSession,
  editSession,
  resolveUserAction,
} from "core/session/actions";
import { getUserCredentials } from "core/user/actions";

const router = express.Router();

router.use(cors());

export default router;

const rootPath = "/sessions";

router.get(rootPath + "/", async (req, res) => {
  const params = req.query;

  const result = await repository.find(params);

  res.json(result).status(200);
});

router.get("/sessions/:id", async (req, res) => {
  const sessionId = req.params.id;

  const result = await repository.findOne({ _id: sessionId });

  res.json(result).status(200);
});

router.get("/session", async (req, res) => {
  const filter = req.query;

  const result = await repository.findOne(filter);

  res.json(result).status(200);
});

router.post(`${rootPath}`, async (req, res) => {
  const payload = req.body;

  let [error, session] = await createSession(payload)
    .then((session) => {
      return [null, session];
    })
    .catch((error) => {
      return [error, null];
    });

  if (error || !session) {
    return res.status(400).end(error || "Invalid data");
  }

  return res.status(201).json(session);
});

router.put(`/sessions/:id`, async (req, res) => {
  const sessionId = req.params.id;
  const payload = req.body;

  let [error, session] = await editSession(sessionId, payload)
    .then((session) => {
      return [null, session];
    })
    .catch((error) => {
      return [error, null];
    });

  if (error || !session) {
    return res.status(400).end(error || "Invalid data");
  }

  return res.status(200).json(session);
});

router.delete(`${rootPath}/:id`, async (req, res) => {
  const id = req.params.id;

  repository
    .findOneAndDelete({ _id: id })
    .then((data) => {
      res.json(data || { ok: true }).status(200);
    })
    .catch((error) => {
      console.log(error);
      res.json({ error }).status(400);
    });
});

router.post(`${rootPath}/connect`, async (req, res) => {
  const { tag, templateId, ownerId } = req.body;

  let session = await repository.findOne({ tag });

  if (!session && !templateId) {
    return res.end("Invalid data").status(400);
  }

  if (!session) {
    session = await templateActions.createFromTemplate(templateId, { tag });
  }

  if (session) {
    // return res.redirect(`/api/sessions/${session._id}/stream`);
    return res.json(session).status(200);
  }

  return res.end("Invalid data").status(400);
});

// user actions
router.post("/sessions/:id/user/:action", async (req, res) => {
  const { id, action } = req.params;
  const decoded: any = getUserCredentials(req);
  const userId = decoded?.id;

  if (!userId) {
    return res.status(400).end("Unauthorized");
  }

  if (!id) {
    return res.status(400).end("Invalid session");
  }

  const session = await repository.findOne({ _id: id }).catch((error) => null);

  if (!session) {
    return res.status(400).end("Invalid session");
  }

  const [error, payload] = await resolveUserAction(id, userId, {
    type: action,
    payload: req.body,
  })
    .then((res) => [null, res])
    .catch((error) => [error.message, null]);

  if (error) {
    return res.status(400).end(error || "Invalid action");
  }

  res.status(200).json(payload);
});

// Broadcast
router.get(`${rootPath}/:id/stream`, async (req, res) => {
  const sessionId = req.params.id;

  if (!sessionId) {
    return res.json({ message: "No access" }).status(400);
  }

  const encoder = new TextEncoder();

  function handleEvent(data: SessionDTO) {
    res.write(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
  }

  addListener("session", sessionId, handleEvent);

  res.once("close", () => {
    removeListener(`session-${sessionId}`, handleEvent);
  });

  Object.entries({
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/event-stream; charset=utf-8",
    Connection: "keep-alive",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    "Content-Encoding": "none",
  }).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
});
