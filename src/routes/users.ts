import express from "express";
import cors from "cors";
import * as controls from "core/user/controls";
import { addUserAssets, getUserCredentials } from "core/user/actions";
import {
  createTransferTransaction,
  createVoucherTransaction,
} from "core/transaction/actions";
import { UserDTO } from "core/user/model";
import { addListener, removeListener } from "core/broadcast/oberver";
import repository from "core/user/repository";

const router = express.Router();

router.use(cors());
router.use(express.json());

/**
 * @swagger
 *
 * /api/users:
 *   get:
 *    summary: Find Users.
 *    description: Find Users.
 *    tags: [Users]
 *    responses:
 *       200:
 *         description: Returns a UserDTO.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/users", async (req, res) => {
  const params = req.query;

  const result = await controls.find(params);

  res.json(result).status(200);
});

router.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;

  const [error, result] = await repository.findOneAndDelete({ _id: userId }).then(res => [null, res]).catch(err => [err, null]);

  if (error) {
    return res.status(400).end(error?.message || error);
  }

  res.json(result).status(200);
});

router.post("/users", (req, res) => {
  const body = req.body;

  controls
    .create(body)
    .then((payload) => {
      res.json(payload).status(201).end();
    })
    .catch((error) => {
      res.json({ error }).status(400).end();
    });
});

router.patch("/users/:id", (req, res) => {
  const userId = req.params.id;
  const body = req.body;

  controls
    .updateOne({ _id: userId }, body)
    .then((payload) => {
      res.json(payload).status(200).end();
    })
    .catch((error) => {
      res.json({ error }).status(400).end();
    });
});

router.post("/users/:id/assets", (req, res) => {
  const userId = req.params.id;
  const { value } = req.body;

  addUserAssets(userId, value)
    .then((payload) => {
      res.json(payload).status(200).end();
    })
    .catch((error) => {
      res.json({ error }).status(400).end();
    });
});

// credentials
router.get("/users/self", async (req, res) => {
  const cred = getUserCredentials(req);

  if (!cred) {
    return res.status(403).json({ error: "not authorized" });
  }

  const result = await controls.findOne({ _id: cred.id });

  res.json(result).status(200);
});

router.post("/user/transactions", async (req, res) => {
  const cred = getUserCredentials(req);

  if (!cred) {
    return res.status(403).json({ error: "not authorized" });
  }

  const { type, payload } = req.body;

  let handler = null;

  switch (type) {
    case "voucher": {
      handler = () =>
        createVoucherTransaction(cred.id, payload.code, payload.details);
      break;
    }
    case "transfer": {
      handler = () =>
        createTransferTransaction(
          cred.id,
          { email: payload.email },
          payload.value,
          payload.details
        );
      break;
    }
  }

  if (!handler) {
    return res.status(400).end("Invalid transaction");
  }

  handler()
    .then((transaction) => {
      res.json(transaction).status(200);
    })
    .catch((error) => {
      res.status(400).end(error?.message || error);
    });
});

router.get(`/user/broadcast`, async (req, res) => {
  const cred = getUserCredentials(req);

  if (!cred) {
    return res.status(403).json({ error: "not authorized" });
  }

  const encoder = new TextEncoder();

  function handleEvent(data: UserDTO) {
    res.write(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
  }

  addListener("user", cred.id, handleEvent);

  res.once("close", () => {
    removeListener(`user-${cred.id}`, handleEvent);
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
