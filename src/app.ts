import "dotenv/config";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./app/config/index";
import router from "./app/routes/index";

import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import qs from "qs";

const app: Application = express();

app.set("query parser", (str: string) => qs.parse(str));

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Request Logger ──────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(
    `\n[${new Date().toLocaleTimeString()}] 🚀 ${req.method} ${req.url}`,
  );
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📦 Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "PropTech AI API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

export default app;
