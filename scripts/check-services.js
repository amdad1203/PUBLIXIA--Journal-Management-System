import { env, validateEnv } from "../backend/config/env.js";
import { connectDB, databaseError } from "../backend/config/db.js";
import mongoose from "mongoose";
import { GoogleGenAI } from "@google/genai";
import { getTransport } from "../backend/services/notifications.js";
const results = {};
try {
  validateEnv();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
await Promise.all([
  (async () => {
    try {
      await connectDB();
      await mongoose.connection.db.command({ ping: 1 });
      results.mongodb = { ok: true, database: mongoose.connection.name };
    } catch (e) {
      results.mongodb = { ok: false, error: databaseError(e) };
    } finally {
      await mongoose.disconnect();
    }
  })(),
  (async () => {
    try {
      const ai = new GoogleGenAI({
        apiKey: env.geminiKey,
        httpOptions: { timeout: 30000 },
      });
      const response = await ai.models.generateContent({
        model: env.geminiModel,
        contents: "Reply with only OK.",
        config: { maxOutputTokens: 1024 },
      });
      results.gemini = {
        ok: !!response.text,
        model: env.geminiModel,
        ...(!response.text
          ? { error: "Provider returned no text within the output limit." }
          : {}),
      };
    } catch (e) {
      results.gemini = {
        ok: false,
        status: e.status || e.code || "network",
        error: "Gemini request failed. Verify key, model and quota.",
      };
    }
  })(),
  (async () => {
    try {
      const mailer = getTransport();
      if (!mailer) {
        results.email = {
          ok: false,
          error: "SMTP sender credentials have not been configured.",
        };
        return;
      }
      await mailer.verify();
      results.email = {
        ok: true,
        note: "SMTP connection verified; no email sent.",
      };
    } catch (e) {
      results.email = { ok: false, code: e.code || "SMTP_ERROR" };
    }
  })(),
]);
console.log(JSON.stringify(results, null, 2));
process.exitCode = Object.values(results).every((r) => r.ok) ? 0 : 1;
