import express from "express";
import cors from "cors";
import * as templateActions from "core/template/actions";

const router = express.Router();

router.use(cors());

export default router;

const rootPath = "/templates";

router.get(`${rootPath}`, (req, res) => {
  const params = req.query;

  templateActions.filterTemplates(params).then((payload) => {
    res.json(payload).status(200);
  }).catch((error) => {
    res.json({ error }).status(400);
  });
});

router.post(`${rootPath}/:id`, (req, res) => {
  const id = req.params.id;
  const body = req.body;

  templateActions.createFromTemplate(id, body).then((payload) => {
    res.json(payload).status(201);
  }).catch((error) => {
    res.json({ error }).status(400);
  });
});
