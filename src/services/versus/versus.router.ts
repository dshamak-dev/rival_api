import express from "express";
import cors from "cors";
import * as controls from "./versusl.controls";

const router = express.Router();

export default router;

router.use(cors());

const rootPath = '/versus';

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
  const id = req.params.id;
  const payload = req.body;

  const result = await controls.update(id, payload);

  res.json(result).status(200).end();
});


// join session
router.post(rootPath + '/user', (req, res) => {
  const body = req.body;

  res.json(body).status(201).end();
});

