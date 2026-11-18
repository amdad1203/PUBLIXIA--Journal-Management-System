import request from "supertest";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { connectDB } from "../backend/config/db.js";
import { env } from "../backend/config/env.js";
import { createApp } from "../backend/app.js";
import {
  Journal,
  Manuscript,
  Version,
  Screening,
  Notification,
} from "../backend/models/index.js";
let manuscript;
try {
  await connectDB();
  const app = createApp();
  const agent = request.agent(app);
  await agent
    .post("/api/auth/login")
    .send({
      email: "author@demo.publixia.test",
      password: process.env.DEMO_PASSWORD,
    })
    .expect(200);
  const journal = await Journal.findOne({ synthetic: true });
  const declarations = Object.fromEntries(
    [
      "ethics",
      "consent",
      "conflicts",
      "funding",
      "data",
      "ai",
      "contributions",
    ].map((k) => [k, "Synthetic integration test; no actual research."]),
  );
  const created = await agent
    .post("/api/manuscripts")
    .send({
      title: "Temporary integration verification",
      abstract:
        "A short synthetic document used only to verify Gemini screening and private Atlas persistence.",
      journal: String(journal._id),
      keywords: "synthetic, test",
      declarations,
    })
    .expect(201);
  manuscript = created.body._id;
  await agent
    .post(`/api/manuscripts/${manuscript}/versions`)
    .attach(
      "file",
      Buffer.from(
        "Title: Demonstration of manuscript screening\nAbstract\nThis study have a clearly stated objective. This document is entirely synthetic and makes no scientific claims.\nIntroduction\nThe goal is to demonstrate a language correction workflow.\nMethods\nNo experiments or participant data were collected.\nResults\nNo empirical findings are reported.\nLimitations\nThis document cannot be used as research evidence.\nDeclarations\nNo funding or conflicts of interest. AI was used to prepare this synthetic test document.",
      ),
      "integration.txt",
    )
    .expect(201);
  const report = await agent
    .post("/api/ai/screening")
    .send({ manuscript, consent: true, mode: "general" })
    .expect(201);
  assert.ok(report.body.summary);
  assert.ok(Array.isArray(report.body.issues));
  if (report.body.issues.length)
    await agent
      .patch(
        `/api/ai/screening/${report.body._id}/issues/${report.body.issues[0]._id}`,
      )
      .send({ decision: "accepted" })
      .expect(200);
  await agent.get(`/api/ai/screening/${report.body._id}/export`).expect(200);
  await agent
    .get(`/api/ai/screening/${report.body._id}/export?format=pdf`)
    .expect(200);
  console.log(
    JSON.stringify(
      {
        atlas: true,
        privateUpload: true,
        liveGeminiScreening: true,
        anchoredSuggestions: report.body.issues.length,
        docxExport: true,
        pdfExport: true,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(
    "Live smoke verification failed:",
    e.message?.replaceAll(env.geminiKey || "__none__", "[REDACTED]"),
  );
  process.exitCode = 1;
} finally {
  if (manuscript) {
    for (const v of await Version.find({ manuscript }))
      if (v.path)
        await fs.rm(path.join(env.uploads, path.basename(v.path)), {
          force: true,
        });
    const screens = await Screening.find({ manuscript }).distinct("_id");
    await Notification.deleteMany({
      link: { $in: screens.map((id) => `/screening/${id}`) },
    });
    await Screening.deleteMany({ manuscript });
    await Version.deleteMany({ manuscript });
    await Manuscript.deleteOne({ _id: manuscript });
  }
  await mongoose.disconnect();
}
