import express from "express";
import cors from "cors";
import * as controls from "core/user/controls";
import * as actions from 'prefabs/game/actions';
import { getUserCredentials } from "core/user/actions";
import { createTransferTransaction, createVoucherTransaction } from "core/transaction/actions";

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
router.get('/users', async (req, res) => {
  const params = req.query;

  const result = await controls.find(params);

  res.json(result).status(200);
});

router.post('/users', (req, res) => {
  const body = req.body;

  controls.create(body).then((payload) => {
    res.json(payload).status(201).end();
  }).catch(error => {
    res.json({ error }).status(400).end();
  });
});

router.patch('/users/:id', (req, res) => {
  const userId = req.params.id;
  const body = req.body;

  controls.updateOne({_id: userId}, body).then((payload) => {
    res.json(payload).status(200).end();
  }).catch(error => {
    res.json({ error }).status(400).end();
  });
});

// credentials
router.get('/users/self', async (req, res) => {
  const cred = getUserCredentials(req);

  if (!cred) {
    return res.status(403).json({ error: 'not authorized' })
  }

  const result = await controls.findOne({ _id: cred.id });

  res.json(result).status(200);
});

router.post('/user/transactions', async (req, res) => {
  const cred = getUserCredentials(req);

  if (!cred) {
    return res.status(403).json({ error: 'not authorized' })
  }

  const { type, payload } = req.body;
  console.log(req.body);

  let handler = null;

  switch (type) {
    case 'voucher': {
      handler = () => createVoucherTransaction(cred.id, payload.code, payload.details); 
      break;
    }
    case 'transfer': {
      handler = () => createTransferTransaction(cred.id, { email: payload.email }, payload.value, payload.details); 
      break;
    }
  }

  if (!handler) {
    return res.status(400).end('Invalid transaction');
  }

  handler().then(transaction => {
    res.json(transaction).status(200);
  }).catch(error => {
    res.status(400).end(error?.message || error);
  });

  
});

export default router;