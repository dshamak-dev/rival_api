import express from "express";
import cors from "cors";
import * as controls from "core/user/controls";
import * as actions from 'prefabs/game/actions';

const router = express.Router();

router.use(cors());

const rootPath = '/users';

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
router.get(rootPath + '/', async (req, res) => {
  const params = req.query;

  const result = await controls.find(params);

  res.json(result).status(200);
});

router.post(rootPath + '/', (req, res) => {
  const body = req.body;

  controls.create(body).then((payload) => {
    res.json(payload).status(201).end();
  }).catch(error => {
    res.json({ error }).status(400).end();
  });
});

router.patch(rootPath + '/:id', (req, res) => {
  const userId = req.params.id;
  const body = req.body;

  controls.updateOne({_id: userId}, body).then((payload) => {
    res.json(payload).status(200).end();
  }).catch(error => {
    res.json({ error }).status(400).end();
  });
});

export default router;