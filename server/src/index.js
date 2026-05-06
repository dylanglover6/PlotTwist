import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "node:url";
import { connectDB } from "./config/db.js";
import healthRouter from "./routes/health.js";
import imageRouter from "./routes/images.js";
import inviteRouter from "./routes/invites.js";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  override: true
});

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Plot Twist API is running" });
});

app.use("/api/health", healthRouter);
app.use("/api/images", imageRouter);
app.use("/api/invites", inviteRouter);

app.use((error, _req, res, _next) => {
  console.error(error);

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
    app.listen(port, () => {
      console.log(`Plot Twist API listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
