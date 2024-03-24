import express from "express";
import cors from "cors";
import repository from "core/transaction/repository";
import { parseResponseError } from "support/promise.utils";
import { tryResolveTransaction } from "core/transaction/actions";

const router = express.Router();

router.use(cors());

router.get(`/transactions`, async (req, res) => {
  const params = req.query;

  repository.find(params)
    .then((result) => {
      res.json(result).status(200);
    })
    .catch((error) => {
      res.status(400).end(parseResponseError(error) || 'Invalid data');
    });
});

router.get(`/transaction`, async (req, res) => {
  const params = req.query;

  repository.findOne(params)
    .then((result) => {
      res.json(result).status(200);
    })
    .catch((error) => {
      res.status(400).end(parseResponseError(error) || 'Invalid data');
    });
});

router.put(`/transactions/:id`, async (req, res) => {
  const id = req.params.id;
  const body = req.body;

  repository.findOneAndUpdate({ _id: id }, body)
    .then((result) => {
      res.json(result).status(200);
    })
    .catch((error) => {
      res.status(400).end(parseResponseError(error) || 'Invalid data');
    });
});

router.put(`/transactions/:id/resolve`, async (req, res) => {
  const id = req.params.id;

  const transaction = await repository.findOne({ _id: id });

  if (!transaction) {
    return res.status(400).end('Invalid transaction');
  }

  tryResolveTransaction(transaction)
    .then((result) => {
      res.json(result).status(200);
    })
    .catch((error) => {
      res.status(400).end(parseResponseError(error) || 'Invalid data');
    });
});

export default router;