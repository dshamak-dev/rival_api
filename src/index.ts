import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";

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

const rootFile = path.join(__dirname, "../public/index.html");
app.use("*", (req, res) => {
  console.log(rootFile);

  if (fs.existsSync(rootFile)) {
    res.status(200).sendFile(rootFile);
  } else {
    res.status(404).end("Are you lost?");
  }
});

//exporting app
export default app;
