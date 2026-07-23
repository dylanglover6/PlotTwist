import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import healthRouter from "./routes/health.js";
import imageRouter from "./routes/images.js";
import inviteRouter from "./routes/invites.js";
import emailRouter from "./routes/email.js";
import { startNotificationCron, safeSweep } from "./jobs/notifications.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true
});

const app = express();
// Dev default 5050 (matches the Vite proxy): macOS AirPlay Receiver holds 5000.
// Production always sets PORT explicitly.
const port = process.env.PORT || 5050;
// In production the process sits behind Caddy on the same host, so bind to
// loopback by default — the app port is never exposed off-box. Override with
// HOST (e.g. 0.0.0.0) for container/other setups.
const host = process.env.HOST || (isProduction ? "127.0.0.1" : "0.0.0.0");
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Behind a hosting proxy in production so req.ip (used for rate limiting and
// the creator IP hash) reflects the real client, not the proxy.
if (isProduction) {
  app.set("trust proxy", 1);
}

// Security headers. The CSP allows only what the app actually loads: its own
// bundle, inline styles (Tailwind/React style attributes), Google Fonts, and
// Unsplash reveal images. `upgrade-insecure-requests` is disabled because TLS
// is terminated at the reverse proxy (which also sets HSTS).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https://images.unsplash.com"],
        "connect-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'self'"],
        "upgrade-insecure-requests": null
      }
    },
    crossOriginResourcePolicy: { policy: "same-origin" }
  })
);

app.use(
  cors({
    origin: clientOrigin
  })
);
app.use(express.json());

// In development the API root returns a small status blob; in production "/"
// is served by the client build below, so this is dev-only.
if (!isProduction) {
  app.get("/", (_req, res) => {
    res.json({ message: "Plot Twist API is running" });
  });
}

app.use("/api/health", healthRouter);
app.use("/api/images", imageRouter);
app.use("/api/invites", inviteRouter);
app.use("/api/email", emailRouter);

// Protected trigger for the notification sweep, for hosts that sleep idle
// instances and drive it from an external cron. Guarded by TASKS_SECRET.
app.post("/api/tasks/notifications", async (req, res, next) => {
  try {
    const secret = process.env.TASKS_SECRET;
    if (!secret || req.get("x-tasks-secret") !== secret) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await safeSweep();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// In production, serve the built client so the whole app deploys as one
// service. API routes are registered above; everything else falls back to the
// SPA's index.html for client-side routing.
if (isProduction) {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);

  // Malformed JSON body from express.json().
  if (error.type === "entity.parse.failed" || error instanceof SyntaxError) {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "CastError") {
    return res.status(404).json({ message: "Resource not found" });
  }

  res.status(500).json({ message: "Something went wrong" });
});

async function startServer() {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(port, host, () => {
      console.log(`Plot Twist API listening on ${host}:${port}`);
    });
    startNotificationCron();
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
