import { Router } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
// import swaggerConfig from "./config.json";
import path from 'path';

const router = Router();

/**
 * @swagger
 *  tags:
 *    name: Games
 */
const spec = swaggerJSDoc({
  swaggerDefinition: {
    restapi: "3.0.0",
    jsonEditor: true,
    info: {
      title: "Rival API",
      version: "0.0.1",
      description: "Rival REST API",
    },
    servers: [
      {
        url: "/",
      },
    ],
  },
  apis: [path.join(__dirname, "../routes/**/*.ts"), path.join(__dirname, "../routes/**/*.js")],
});

router.use("/docs", swaggerUI.serve, swaggerUI.setup(spec));

export default router;
