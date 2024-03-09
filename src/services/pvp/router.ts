import express from "express";
import cors from "cors";
import { create, findSession, updateSession } from "./controls";

const router = express.Router();

export default router;

router.use(cors());

const rootPath = '/pvp';

// router.get(rootPath + '/', (req, res) => {
//   res.json({ message: "Welcome to PvP!" });
// });

// create session
router.post(rootPath + '/', (req, res) => {
  const body = req.body;

  create(body).then((payload) => {
    res.json(body).status(201).end();
  }).catch(error => {
    res.json({ error }).status(400).end();
  });
});
// find session
router.get(rootPath + '/', async (req, res) => {
  const params = req.query;

  const result = await findSession(params);

  res.json(result).status(200).end();
});

// update session
router.patch(rootPath + '/:id', async (req, res) => {
  const id = req.params.id;
  const payload = req.body;

  const result = await updateSession(id, payload);

  res.json(result).status(200).end();
});


// join session
router.post(rootPath + '/user', (req, res) => {
  const body = req.body;

  res.json(body).status(201).end();
});

