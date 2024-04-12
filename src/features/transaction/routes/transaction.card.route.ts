import express from "express";
import { confirmIntent, createIntent } from "features/transaction/actions/card.actions";
import { assetPackages } from "features/transaction/store/transaction.products";
import { getRequestUser } from "features/user/utils/user.auth.utils";
const router = express.Router();

router.use(express.json());

router.get("/api/shop/products", (req, res) => {
  res.status(200).json(assetPackages);
});
router.post("/api/intents", async (req, res) => {
  const { productId } = req.body;
  const user = getRequestUser(req);

  if (!user){
    return res.status(403).end('Not authorized');
  }

  const product = assetPackages.find((it) => it.id === productId);

  if (!product){
    return res.status(400).end('Invalid product');
  }

  const intent = await createIntent(user?.id, product);

  res.status(201).json(intent);
});
router.put("/api/intents/confirm", async (req, res) => {
  const { id } = req.body;
  const user = getRequestUser(req);

  if (!user){
    return res.status(403).end('Not authorized');
  }

  confirmIntent(user?.id, id).then((transaction) => {
    res.status(201).json(transaction);
  }).catch(error => {
    res.status(400).end(error?.message || error);
  });
});


router.post("/api/intents/transactions", (req, res) => {
  const user = getRequestUser(req);

  if (!user){
    return res.status(403).end('Not authorized');
  }

  const payload = req.body;


});

export default router;
