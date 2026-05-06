import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    app: "Plot Twist API",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

export default router;
