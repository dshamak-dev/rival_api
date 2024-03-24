import express from "express";

import docsRouter from "./swagger";
import routers from "./routes";
import path from 'path';
import fs from 'fs';

import { initialize } from "./core/repository";

initialize();

const app = express();
app.use(express.json());

app.use(docsRouter);

const scriptPath = path.join(__dirname, "./client/index.js");

app.options(`/client.js`, (req, res, next) => {
  res.header("Access-Control-Allow-Credentials", 'true');
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  res.sendStatus(200);
});
app.get(`/client.js`, (req, res) => {
  let fileString = fs.readFileSync(scriptPath).toString();

  if (fileString) {
    const rootUrl = `${req.protocol}://${req.headers.host}`;
    fileString = fileString.replace('{ ENV_PATH }', rootUrl);
  }

  res.header("Access-Control-Allow-Credentials", 'true');
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  res.contentType('text/javascript').end(fileString);
});

app.options(`/api/*`, (req, res, next) => {
  res.header("Access-Control-Allow-Credentials", 'true');
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  res.sendStatus(200);
});

export const serviceProcess = new Promise(async (res) => {
  const _list = Object.values(routers);

  for (const router of _list) {
    app.use("/api", router);
  }

  res(true);
});

//exporting app
export default app;
