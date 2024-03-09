import express from "express";

const router = express.Router();
const rootPath = '/auth';

export default async function init() {
  return router;
}

router.get(rootPath + '/', (req, res) => {
  res.json({ ok: false });
});