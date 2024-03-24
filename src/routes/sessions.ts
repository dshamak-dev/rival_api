import express from "express";
import cors from "cors";
import { addListener, removeListener } from "core/broadcast/oberver";
import { SessionDTO } from "core/session/model";
import repository from "core/session/repository";
import * as templateActions from "core/template/actions";

const router = express.Router();

router.use(cors());

export default router;

const rootPath = "/sessions";

router.get(rootPath + "/", async (req, res) => {
  const params = req.query;

  const result = await repository.find(params);

  res.json(result).status(200);
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

router.get(`${rootPath}/:id/stream`, async (req, res) => {
  const sessionId = req.params.id;

  if (!sessionId) {
    return res.json({ message: "No access" }).status(400);
  }

  const encoder = new TextEncoder();

  function handleEvent(data: SessionDTO) {
    res.write(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
  }

  addListener('session', sessionId, handleEvent);

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
