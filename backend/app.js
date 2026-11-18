import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import mongoose from "mongoose";
import path from "node:path";
import fs from "node:fs";
import { ZodError } from "zod";
import { env, root } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { publishing } from "./routes/publishing.js";
import { research } from "./routes/research.js";
import { community } from "./routes/community.js";
import { createAIRouter } from "./routes/ai.js";
import { intelligence } from "./routes/intelligence.js";
import {authorWorkspace} from './routes/author.js';
import {governance} from './routes/governance.js';
import {operations} from './routes/operations.js';
export function createApp(options = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: env.production ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Please try again shortly." },
    }),
  );
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      const allowed = new Set([
        new URL(env.appUrl).origin,
        ...(!env.production
          ? [
              "http://localhost:5173",
              "http://127.0.0.1:5173",
              `http://localhost:${env.port}`,
              `http://127.0.0.1:${env.port}`,
            ]
          : []),
      ]);
      if (origin && !allowed.has(origin))
        return res
          .status(403)
          .json({ error: "Request origin is not permitted." });
      if (req.headers["sec-fetch-site"] === "cross-site")
        return res
          .status(403)
          .json({ error: "Cross-site requests are not permitted." });
    }
    next();
  });
  app.get("/api/health", (req, res) =>
    res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
      ok: mongoose.connection.readyState === 1,
      database:
        mongoose.connection.readyState === 1 ? "connected" : "unavailable",
    }),
  );
  app.use("/api", (req, res, next) =>
    mongoose.connection.readyState === 1
      ? next()
      : res.status(503).json({
          error: "Database is temporarily unavailable. Please try again later.",
        }),
  );
  app.use("/api/auth", authRouter);
  app.use('/api',operations);
  app.use('/api',authorWorkspace);
  app.use('/api',governance);
  app.use("/api", intelligence);
  app.use("/api/ai", createAIRouter(options));
  app.use("/api", community);
  app.use("/api", publishing);
  app.use("/api", research);
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API endpoint not found." }),
  );
  const dist = path.join(root, "dist");
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false }));
    app.get("/{*path}", (req, res) =>
      res.sendFile("index.html", { root: dist }),
    );
  }
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ZodError)
      return res.status(400).json({
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    if (error.code === 11000)
      return res.status(409).json({ error: "This record already exists." });
    if (error.name === "VersionError")
      return res.status(409).json({
        error: "This record changed in another request. Refresh and try again.",
      });
    if (error.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ error: "File exceeds the 10 MB limit." });
    if (
      error.name === "CastError" ||
      error.name === "ValidationError" ||
      error instanceof SyntaxError
    )
      return res.status(400).json({ error: "Invalid request data." });
    if (!error.status) console.error("Request failed:", error.name);
    res.status(error.status || 500).json({
      error: error.status
        ? error.message
        : "Something went wrong. Please try again.",
      code: error.code && error.status ? error.code : undefined,
    });
  });
  return app;
}
