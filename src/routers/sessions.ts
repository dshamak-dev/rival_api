import express from "express";
import cors from "cors";
import { addListener, removeListener } from "core/session/oberver";
import { SessionDTO } from "core/session/model";

const router = express.Router();

router.use(cors());

export default router;

const rootPath = "/sessions";

router.get(`${rootPath}/:id/stream`, async (req, res) => {
  const sessionId = req.params.id;

  if (!sessionId) {
    return res.json({ message: "No access" }).status(400);
  }

  const encoder = new TextEncoder();

  function handleEvent(data: SessionDTO) {
    res.write(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
  }

  addListener(sessionId, handleEvent);

  res.once("close", () => {
    removeListener(sessionId, handleEvent);
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
