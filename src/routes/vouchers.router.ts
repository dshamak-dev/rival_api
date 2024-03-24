import express from "express";
import cors from "cors";
import { createVoucher, filterVouchers, findVoucher } from "core/voucher/actions";
import { parseResponseError } from "support/promise.utils";

const router = express.Router();

router.use(cors());

router.get(`/vouchers`, async (req, res) => {
  const params = req.query;

  filterVouchers(params)
    .then((result) => {
      res.json(result).status(200);
    })
    .catch((error) => {
      res.status(400).end(parseResponseError(error) || 'Invalid data');
    });
});

router.get(`/voucher`, async (req, res) => {
  const params = req.query;

  findVoucher(params)
    .then((result) => {
      res.json(result).status(200);
    })
    .catch((error) => {
      res.status(400).end(parseResponseError(error) || 'Invalid data');
    });
});

/**
 * @swagger
 * /api/vouchers:
 *  post:
 *    summary: Create Voucher.
 *    tags: [Voucher]
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
 *            ownerType:
 *              type: number
 *            value:
 *              type: number
 *            code:
 *              type: string
 *            capacity:
 *              type: number
 * 
 *    responses:
 *       201:
 *         description: Returns VoucherDTO.
 */
router.post(`/vouchers`, async (req, res) => {
  const payload = req.body;

  createVoucher(payload)
    .then((result) => {
      res.json(result).status(201).end();
    })
    .catch((error) => {
      res.status(400).end(parseResponseError(error) || 'Invalid data');
    });
});

export default router;