import express from "express";
import cors from "cors";
import * as templateActions from "core/template/actions";
import * as controls from "prefabs/game/controls";
import * as actions from "prefabs/game/actions";
import { SessionStageType, SessionType } from "core/session/model";

const router = express.Router();

router.use(cors());

const rootPath = "/games";
/**
 * @swagger
 *
 * /api/games/templates:
 *   post:
 *    summary: Create Game Template.
 *    tags: [Games]
 *    description: Create Game Template
 *    consumes:
 *      - application/json
 *    parameters:
 *      - in: body
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            ownerId:
 *              type: string
 *            title:
 *              type: string
 *            minUsers:
 *              type: number
 *          
 *    responses:
 *       201:
 *         description: Returns a TemplateDTO.
 */
router.post(rootPath + "/templates", (req, res) => {
  const { ownerId, title, details, ...config } = req.body;

  const payload = {
    ownerId,
    title,
    details,
    sessionType: SessionType.Game,
    config: {
      ...config,
      minUsers: 2,
    },
  };

  templateActions
    .createTemplate(payload)
    .then((payload) => {
      res.json(payload).status(201).end();
    })
    .catch((error) => {
      res.json({ error }).status(400).end();
    });
});
/**
 * @swagger
 *
 * /api/games/templates/:id:
 *   get:
 *    summary: Find Game Template.
 *    description: Find Game Template by ID.
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        type: integer
 *    tags: [Games]
 *    responses:
 *       200:
 *         description: Returns a TemplateDTO.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 */
router.get(rootPath + "/templates/:id", (req, res) => {
  const id = req.params.id;

  templateActions
    .findTemplate(id)
    .then((payload) => {
      res.json(payload).status(200).end();
    })
    .catch((error) => {
      res.json({ error }).status(400).end();
    });
});

/**
 * @swagger
 *
 * /api/games:
 *   post:
 *     summary: Create new Game Session.
 *     tags: [Games]
 *     description: Create Game Session
 *     responses:
 *       201:
 *         description: Returns a GameDTO.
 */
router.post(rootPath + "/", (req, res) => {
  const body = req.body;

  controls
    .create(body)
    .then((payload) => {
      res.json(payload).status(201).end();
    })
    .catch((error) => {
      res.json({ error }).status(400).end();
    });
});
/**
 * @swagger
 * /api/games:
 *  get:
 *     summary: Filter Game Session.
 *     tags: [Games]
 *     responses:
 *       201:
 *         description: Returns a GameDTO.
 */
router.get(rootPath + "/", async (req, res) => {
  const params = req.query;

  const result = await controls.find(params);

  res.json(result).status(200);
});

/**
 * @swagger
 * /api/games/:id:
 *  patch:
 *     summary: Update Game Session.
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: Returns updated GameDTO.
 */
router.patch(rootPath + "/:id", async (req, res) => {
  const sessionId = req.params.id;
  const { userId, ...payload } = req.body;

  const result = await controls.updateOne(sessionId, payload);

  res.json(result).status(200).end();
});

/**
 * @swagger
 * /api/games/:id/users:
 *  post:
 *     summary: Connect Game User.
 *     tags: [Games]
 *     responses:
 *       201:
 *         description: Returns updated GameDTO.
 */
router.post(`${rootPath}/:id/users`, async (req, res) => {
  const sessionId = req.params.id;
  const { userId } = req.body;

  actions
    .connectUser(sessionId, userId)
    .then((result) => {
      res.json(result).status(201).end();
    })
    .catch((error) => {
      res.json(error).status(400).end();
    });
});
/**
 * @swagger
 * /api/games/:id/users/:userId:
 *  delete:
 *     summary: Remove Game User.
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: Returns updated GameDTO.
 */
router.delete(`${rootPath}/:id/users/:userId`, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.params.userId;

  actions
    .removeUser(sessionId, userId)
    .then((result) => {
      res.json(result).status(200).end();
    })
    .catch((error) => {
      res.json(error).status(400).end();
    });
});
/**
 * @swagger
 * /api/games/:id/stages:
 *  post:
 *     summary: Switch between game stages.
 *     tags: [Games]
 *     responses:
 *       201:
 *         description: Returns updated GameDTO.
 */
router.post(`${rootPath}/:id/stages`, async (req, res) => {
  const sessionId = req.params.id;
  const { stage } = req.body;

  let nextAction;

  switch (Number(stage)) {
    case SessionStageType.Lobby: {
      nextAction = actions.publishGame.bind(null, sessionId);
      break;
    }
    case SessionStageType.Active: {
      nextAction = actions.startGame.bind(null, sessionId);
      break;
    }
  }

  if (!nextAction) {
    return res.json("Invalid stage").status(400).end();
  }

  try {
    nextAction()
      .then((result) => {
        res.json(result).status(201).end();
      })
      .catch((error) => {
        res.json(error).status(400).end();
      });
  } catch (error) {
    res.json(error).status(400).end();
  }
});
/**
 * @swagger
 * /api/games/:id/users/:userId/offers:
 *  post:
 *     summary: Set user offer.
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: Returns updated GameDTO.
 */
router.post(`${rootPath}/:id/users/:userId/offers`, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.params.userId;
  const { value } = req.body;

  actions
    .setUserOffer(sessionId, userId, value)
    .then((result) => {
      res.json(result).status(201).end();
    })
    .catch((error) => {
      res.json(error).status(400).end();
    });
});

router.post(`${rootPath}/:id/rounds`, async (req, res) => {
  const sessionId = req.params.id;

  actions
    .startRound(sessionId)
    .then((result) => {
      res.json(result).status(201).end();
    })
    .catch((error) => {
      res.json(error).status(400).end();
    });
});

router.post(`${rootPath}/:id/users/:userId/score`, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.params.userId;
  const { value } = req.body;

  actions
    .setUserScore(sessionId, userId, value)
    .then((result) => {
      res.json(result).status(200).end();
    })
    .catch((error) => {
      res.json(error).status(400).end();
    });
});

// router.post(`${rootPath}/:id/rounds/current/end`, async (req, res) => {
//   const sessionId = req.params.id;
//   const { winners } = req.body;

//   actions
//     .endRound(sessionId, winners)
//     .then((result) => {
//       res.json(result).status(200).end();
//     })
//     .catch((error) => {
//       res.json(error).status(400).end();
//     });
// });

export default router;
