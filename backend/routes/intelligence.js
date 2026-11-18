import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { auth, allow } from "../middleware/auth.js";
import { parse, fail } from "../utils/http.js";
import { Audit, Project, Paper } from "../models/index.js";
import {
  domains,
  retrieve,
  synchronize,
  ResearchRecord,
  ImportRun,
} from "../services/discovery.js";
export const Criteria = mongoose.model(
  "EvaluationCriteria",
  new mongoose.Schema(
    {
      name: String,
      domain: String,
      instructions: String,
      weights: { type: Map, of: Number },
      depth: String,
      published: Boolean,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true },
  ),
);
export async function researchContext(user) {
  const projects = await Project.find({
    ...(user.activeProject ? {_id:user.activeProject}:{}),
    $or: [{ owner: user._id }, { members: user._id }],
  })
    .select("title domain objectives")
    .limit(5)
    .lean();
  return {
    interests: user.interests || "",
    affiliation: user.affiliation || "",
    projects,
  };
}
export async function activeCriteria(domain = "general") {
  return (
    (await Criteria.findOne({ published: true, domain })
      .sort({ createdAt: -1 })
      .lean()) ||
    (await Criteria.findOne({ published: true, domain: "general" })
      .sort({ createdAt: -1 })
      .lean())
  );
}
export const intelligence = Router();
intelligence.get("/intelligence/bangladesh", async (req, res) =>
  res.json(
    await ResearchRecord.find({ provider: "topscinet" })
      .sort({ ranking: 1 })
      .limit(10),
  ),
);
intelligence.get("/intelligence/domains", (req, res) => res.json(domains));
const querySchema = z.object({
  provider: z
    .enum(["openalex", "crossref", "europepmc", "datacite"])
    .default("openalex"),
  kind: z
    .enum(["works", "authors", "sources", "institutions", "topics"])
    .default("works"),
  q: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(1).max(100).default(1),
  country: z.enum(["", "BD"]).default(""),
});
intelligence.get("/intelligence/search", async (req, res) =>
  res.json(await retrieve(querySchema.parse(req.query))),
);
intelligence.get("/intelligence/records", async (req, res) => {
  const p = querySchema.parse(req.query);
  const filter = {
    provider: p.provider,
    kind: p.kind,
    ...(p.country ? { country: p.country } : {}),
    ...(p.q
      ? {
          title: {
            $regex: p.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {}),
  };
  res.json({
    records: await ResearchRecord.find(filter)
      .sort({ retrievedAt: -1 })
      .skip((p.page - 1) * 20)
      .limit(20),
    total: await ResearchRecord.countDocuments(filter),
    page: p.page,
  });
});
intelligence.use("/intelligence", auth);
intelligence.get("/intelligence/context", async (req, res) =>
  res.json(await researchContext(req.user)),
);
intelligence.post("/intelligence/save", async (req, res) => {
  const { record } = parse(
    z.object({ record: z.string().regex(/^[a-f\d]{24}$/i) }),
    req,
  );
  const r = await ResearchRecord.findById(record);
  if (!r || r.kind !== "works") fail(404, "Saved publication not found.");
  const p = await Paper.findOneAndUpdate(
    { owner: req.user._id, doi: r.doi || r.externalId },
    {
      $setOnInsert: {
        owner: req.user._id,
        doi: r.doi || r.externalId,
        title: r.title,
        authors: r.authors,
        year: r.year,
        url: r.url,
        abstract: r.abstract,
        source: r.provider,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  res.json(p);
});
intelligence.get("/intelligence/criteria", allow("admin"), async (req, res) =>
  res.json(await Criteria.find().sort({ createdAt: -1 }).limit(100)),
);
intelligence.post(
  "/intelligence/criteria",
  allow("admin"),
  async (req, res) => {
    const b = parse(
      z.object({
        name: z.string().trim().min(3).max(120),
        domain: z.string().min(2).max(100),
        instructions: z.string().trim().min(30).max(12000),
        depth: z.enum(["concise", "detailed"]).default("detailed"),
        weights: z
          .record(z.string().max(80), z.number().min(0).max(100))
          .default({}),
        published: z.boolean().default(false),
      }),
      req,
    );
    const c = await Criteria.create({ ...b, author: req.user._id });
    await Audit.create({
      actor: req.user._id,
      action: b.published ? "criteria.publish" : "criteria.draft",
      resource: "EvaluationCriteria",
      resourceId: String(c._id),
    });
    res.status(201).json(c);
  },
);
intelligence.post("/intelligence/sync", allow("admin"), async (req, res) =>
  res.json(await synchronize(querySchema.parse(req.body))),
);
intelligence.get("/intelligence/imports", allow("admin"), async (req, res) =>
  res.json(await ImportRun.find().sort({ createdAt: -1 }).limit(50)),
);
