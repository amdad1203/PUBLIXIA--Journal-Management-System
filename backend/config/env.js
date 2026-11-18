import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
dotenv.config({ path: path.join(root, ".env"), quiet: true });
export const env = {
  port: Number(process.env.PORT || 4000),
  production: process.env.NODE_ENV === "production",
  appUrl: process.env.APP_URL || "http://localhost:4000",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  geminiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  uploads: path.resolve(root, process.env.UPLOAD_DIR || "uploads"),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
  },
};
export function validateEnv() {
  if (!env.mongoUri)
    throw new Error("MONGODB_URI is required. Copy .env.example to .env.");
  if (!env.jwtSecret || env.jwtSecret.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 random characters.");
  if (env.production && !env.appUrl.startsWith("https://"))
    throw new Error("Production APP_URL must use HTTPS.");
}
