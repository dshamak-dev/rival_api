import { Router } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import swaggerConfig from "./config.json";

const router = Router();

/**
 * @swagger
 *  tags:
 *    name: Games
 */
const spec = swaggerJSDoc(swaggerConfig);

router.use("/docs", swaggerUI.serve, swaggerUI.setup(spec));

export default router;
