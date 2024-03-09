import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import services from "./services/";

//App Varaibles
dotenv.config();

//intializing the express app
const app = express();

//using the dependancies
app.use(helmet());
app.use(cors());
app.use(express.json());

const _list = Object.values(services);
for (const service of _list) {
  service().then((router) => {
    app.use("/api", router);
  });
}

//exporting app
export default app;
