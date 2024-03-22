import express from "express";
import cors from "cors";
import { encodeUserToken, findUser } from "core/user/actions";

const router = express.Router();

router.use(cors());

const rootPath = "/auth";

router.post(`${rootPath}`, (req, res, next) => {
  const { email, password } = req.body;

  findUser({ email })
    .then((user) => {
      if (user?.password !== password) {
        throw new Error("Invalid email or password");
      }

      // const tokenData = { email: user.email, id: user._id };
      const token = encodeUserToken(user);

      if (token) {
        res.header("Authorization", `Bearer ${token}`);
        res.header("Set-Cookie", [
          `rivalAccessToken=${token}; HttpOnly; Path=/; Secure=True;`,
        ]);
      }

      return res.json(token).status(200);
    })
    .catch((error) => {
      res
        .status(400)
        .end(
          typeof error === "string"
            ? error
            : error?.message || "You are not ready!"
        );
    });
});

export default router;
