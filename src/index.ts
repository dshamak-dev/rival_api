import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import docsRouter from "./swagger";
import services from "./services/";

//App Varaibles
dotenv.config();

import { initialize } from "./core/repository";

initialize();

//intializing the express app
const app = express();

//using the dependancies
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(docsRouter);

export const serviceProcess = new Promise(async (res) => {
  const _list = Object.values(services);

  for (const service of _list) {
    const router = await service();
    app.use("/api", router);
  }

  res(true);
});

//exporting app
export default app;
