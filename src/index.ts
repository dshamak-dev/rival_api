import express from "express";

import docsRouter from "./swagger";
import routers from "./routes";

// import clientRouter from "./routes/client";

import { initialize } from "./core/repository";

initialize();

//intializing the express app
const app = express();

//using the dependancies
// app.use(helmet());
// app.use(cors());
app.use(express.json());

// app.options('/*', (req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
//   res.sendStatus(200);
// });

app.use(docsRouter);

// app.use(clientRouter);

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
