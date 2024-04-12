import express from "express";

import docsRouter from "./swagger";
import routers from "./routes";
import path from "path";
import fs from "fs";

import { initialize } from "./core/repository";
import transactionRoutes from './features/transaction/routes';

const isProd = process.env.production;

initialize();

const app = express();
app.use(express.json());

app.use(docsRouter);

const rootFolder = process.cwd();

const scriptPath = path.join(rootFolder, "./public/widget.js");

app.options(`*`, (req, res, next) => {
  res.set({
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": req.headers.origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
  });
  res.status(200).end();
});

app.get(`/client.js`, (req, res) => {
  let fileString = fs.readFileSync(scriptPath).toString();

  if (fileString) {
    const rootUrl = `${isProd ? "https" : req.protocol}://${req.headers.host}`;
    fileString = fileString.replace("{ ENV_PATH }", rootUrl);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  res.contentType("text/javascript").end(fileString);
});

export const serviceProcess = new Promise(async (res) => {
  const _list = Object.values(routers);

  for (const router of _list) {
    app.use("/api", router);
  }

  res(true);
});

useRoutes(transactionRoutes);

function useRoutes(routes: any[]) {
  routes?.forEach((router) => {
    app.use(router);
  });
}

//exporting app
export default app;
