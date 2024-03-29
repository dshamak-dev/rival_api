import express from "express";
import cors from "cors";
import { encodeUserToken, findUser } from "core/user/actions";

const router = express.Router();

router.use(cors());

const rootPath = "/auth";

router.delete('/auth', (req, res) => {
  res.clearCookie('rivalAccessToken', { httpOnly: false, secure: true });
  res.status(204).end();
});

router.post(`${rootPath}`, (req, res, next) => {
  const { email, password, domain } = req.body;

  findUser({ email })
    .then((user) => {
      if (user?.password !== password) {
        throw new Error("Invalid email or password");
      }

      // const tokenData = { email: user.email, id: user._id };
      const token = encodeUserToken(user);

      if (token) {
        res.header("Authorization", `Bearer ${token}`);
        res.header("Cache-Control", `no-cache`);
        // res.header("Set-Cookie", [
        //   `rivalAccessToken=${token}; Path=/; Domain=.${domain}; Secure=False; SameSite=None;`,
        // ]);
        res.cookie("rivalAccessToken", token, { httpOnly: false, domain: `.${domain}`, secure: false })
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
