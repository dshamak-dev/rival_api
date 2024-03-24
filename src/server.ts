import { config } from "dotenv";
import path from "path";
import fs from "fs";
import express from "express";
import helmet from "helmet";

const isProd = !!process.env.production;

const envPath = path.join(__dirname, `../${isProd ? "prod" : "local"}.env`);

config({ path: envPath });

import app, { serviceProcess } from ".";

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const rootFile = path.join(__dirname, "../public/index.html");
const notFoundFile = path.join(__dirname, "../public/404.html");

const authFormFile = path.join(__dirname, "../public/auth.html");

app.get("/auth", (req, res) => {
  if (fs.existsSync(authFormFile)) {
    // res.header('Content-Security-Policy', 'frame-ancestors http://localhost:3001')
    res.status(200).sendFile(authFormFile);
  } else {
    req.next();
  }
});

serviceProcess.finally(() => {
  app.get("/", (req, res) => {
    if (fs.existsSync(rootFile)) {
      res.status(200).sendFile(rootFile);
    } else {
      req.next();
    }
  });

  app.use("/api/*", (req, res) => {
    res.status(404).end('invalid route');
  });

  app.use((req, res) => {
    if (fs.existsSync(notFoundFile)) {
      res.status(200).sendFile(notFoundFile);
    } else {
      res
        .status(200)
        .setHeader("content-type", "text/html; charset=UTF-8")
        .end(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                html { font-size: 28px; }
                body { margin: 0; background: #222; color: #eee; min-height: 100vh; display: grid; align-items: center; text-align: center; }
              </style>
            </head>
            <body>
              <article>
                <h1>Nothing here, it's 404</h1>
              </article>
            </body>
          </html>
          `.trim()
        );
    }
  });
});

app.listen(PORT, async () => {
  console.log(`listning on port ${PORT}`);
});
