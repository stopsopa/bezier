import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import serveIndex from "serve-index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = (function () {
  try {
    return console.log;
  } catch (e) {
    return function () {};
  }
})();

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 3000;

const web = path.resolve(__dirname);

const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

// Simple health check endpoint (from existing implementation)
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Delay middleware - delays response if ?delay=X query parameter is present
app.use((req, res, next) => {
  const delayParam = req.query.delay;
  if (delayParam) {
    const delayMs = parseInt(delayParam, 10);
    if (!isNaN(delayMs) && delayMs > 0) {
      log(`⏱️  Delaying response for ${delayMs}ms: ${req.path}`);
      setTimeout(next, delayMs);
      return;
    }
  }
  next();
});

app.use((req, res, next) => {
  // Disable caching for all requests
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(
  express.static(web, {
    index: false, // stop automatically serve index.html if present
    setHeaders: (res) => {
      // Ensure no-cache headers are set for static files
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
    },
  }),
  serveIndex(web, {
    icons: true,
    view: "details",
    hidden: false,
  }),
);

app.listen(port, host, () => {
  log(`\n 🌎  HTTP Server is running http://${host}:${port}`);
});

// Try to start HTTPS server if certs exist
import fs from "fs";
import https from "https";

const keyPath = path.join(__dirname, "key.pem");
const certPath = path.join(__dirname, "cert.pem");

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    // Use port + 1 for HTTPS, or 3443 if default
    const httpsPort = process.env.HTTPS_PORT || parseInt(port) + 1;

    https.createServer(httpsOptions, app).listen(httpsPort, host, () => {
      log(` 🔒  HTTPS Server is running https://${host}:${httpsPort}\n`);
    });
  } catch (e) {
    log(` ⚠️  Failed to start HTTPS server: ${e.message}\n`);
  }
} else {
  throw new Error("SSL certificate files not found. Run /bin/bash refreshhttps.sh to generate them.");
}
