import express from "express";
import cors from "cors";
import * as controls from "prefabs/game/controls";
import * as actions from 'prefabs/game/actions';

const router = express.Router();

router.use(cors());

const rootPath = '/games';

// create session
router.post(rootPath + '/', (req, res) => {
  const body = req.body;

  controls.create(body).then((payload) => {
    res.json(payload).status(201).end();
  }).catch(error => {
    res.json({ error }).status(400).end();
  });
});
// find session
router.get(rootPath + '/', async (req, res) => {
  const params = req.query;

  const result = await controls.find(params);

  res.json(result).status(200);
});

// update session
router.patch(rootPath + '/:id', async (req, res) => {
  const sessionId = req.params.id;
  const { userId, ...payload} = req.body;

  const result = await controls.update(sessionId, payload);

  res.json(result).status(200).end();
});

router.post(`${rootPath}/:id/users`, async (req, res) => {
  const sessionId = req.params.id;
  const { userId } = req.body;

  actions.connectUser(sessionId, userId).then((result) => {
    res.json(result).status(201).end();
  }).catch((error) => {
    res.json(error).status(400).end();
  });
});

router.delete(`${rootPath}/:id/users/:userId`, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.params.userId;

  actions.removeUser(sessionId, userId).then((result) => {
    res.json(result).status(200).end();
  }).catch((error) => {
    res.json(error).status(400).end();
  });
});

export default router;