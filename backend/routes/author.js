import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { auth, allow } from "../middleware/auth.js";
import { Document, Paper, User, Project } from "../models/index.js";
import { projectAccess } from "../services/access.js";
import { id, parse, fail } from "../utils/http.js";
import { retrieve } from "../services/discovery.js";
export function evidenceText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(evidenceText).join("\n");
  if (typeof value === "object")
    return Object.entries(value)
      .map(
        ([key, item]) => `${key.replaceAll("_", " ")}: ${evidenceText(item)}`,
      )
      .join("\n");
  return String(value);
}
export const CuratedRecord = mongoose.model(
  "CuratedRecord",
  new mongoose.Schema(
    {
      key: { type: String, unique: true },
      kind: String,
      data: mongoose.Schema.Types.Mixed,
      sourceUrl: String,
      checkedAt: Date,
      checkStatus: String,
      httpStatus: Number,
    },
    { timestamps: true },
  ),
);
export const authorWorkspace = Router();
const SourceFollow=mongoose.model('SourceFollow',new mongoose.Schema({owner:{type:mongoose.Schema.Types.ObjectId,required:true},record:{type:mongoose.Schema.Types.ObjectId,required:true}},{timestamps:true}).index({owner:1,record:1},{unique:true}));
authorWorkspace.get("/author/catalog", async (req, res) => {
  const { kind, q } = z
    .object({
      kind: z
        .enum([
          "publications",
          "researchers",
          "journals",
          "opportunities",
          "conferences",
        ])
        .default("publications"),
      q: z.string().max(200).default(""),
    })
    .parse(req.query);
  const rows = await CuratedRecord.find({ kind }).sort({ createdAt: 1 }).lean();
  res.json(
    rows.filter((r) =>
      JSON.stringify(r.data).toLowerCase().includes(q.toLowerCase()),
    ),
  );
});
authorWorkspace.get("/research/discover", async (req, res) => {
  const { q, provider, page } = z
    .object({
      q: z.string().max(200).default(""),
      provider: z
        .enum(["openalex", "crossref", "europepmc", "datacite"])
        .default("openalex"),
      page: z.coerce.number().int().min(1).max(100).default(1),
    })
    .parse(req.query);
  const r = await retrieve({ q, provider, page, kind: "works" });
  res.json({ ...r, items: r.records });
});
authorWorkspace.use("/author", auth);
authorWorkspace.use('/author', (req,res,next)=>{
  if (/^\/(context|projects)(\/|$)/.test(req.path)) return allow('researcher','admin')(req,res,next);
  return allow('researcher')(req,res,next);
});
authorWorkspace.get('/author/following',async(req,res)=>res.json(await SourceFollow.find({owner:req.user._id}).select('record')));
authorWorkspace.put('/author/catalog/:id/follow',async(req,res)=>{id.parse(req.params.id);const {following}=parse(z.object({following:z.boolean()}),req);const record=await CuratedRecord.findOne({_id:req.params.id,kind:'researchers'});if(!record)fail(404,'Researcher record not found.');if(following)await SourceFollow.updateOne({owner:req.user._id,record:record._id},{$setOnInsert:{owner:req.user._id,record:record._id}},{upsert:true});else await SourceFollow.deleteOne({owner:req.user._id,record:record._id});res.json({following});});
authorWorkspace.get("/author/context", async (req, res) => {
  const p = req.user.activeProject
    ? await Project.findOne({
        _id: req.user.activeProject,
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      })
    : null;
  res.json({ project: p });
});
authorWorkspace.put("/author/context", async (req, res) => {
  const { project } = parse(z.object({ project: id.nullable() }), req);
  if (project) await projectAccess(req.user, project);
  await User.updateOne(
    { _id: req.user._id },
    { $set: { activeProject: project } },
  );
  res.json({ ok: true });
});
const modules = z
  .array(
    z.object({
      key: z.string().max(100),
      title: z.string().max(150),
      text: z.string().max(20000),
      status: z.enum([
        "not_started",
        "draft",
        "needs_evidence",
        "needs_review",
        "complete",
      ]),
      sourceIds: z.array(id).max(100).default([]),
      resultIds: z.array(z.string().max(100)).max(100).default([]),
    }),
  )
  .max(40);
authorWorkspace.put("/author/documents/:id", async (req, res) => {
  id.parse(req.params.id);
  const b = parse(
    z.object({
      revision: z.number().int().min(0),
      template: z.string().max(80),
      project: id.nullable().optional(),
      modules,
      results: z
        .array(
          z.object({
            key: z.string().max(100),
            title: z.string().max(150),
            dataset: z.string().max(500),
            method: z.string().max(5000),
            findings: z.string().max(5000),
            limitations: z.string().max(5000),
          }),
        )
        .max(100)
        .default([]),
    }),
    req,
  );
  const d = await Document.findOne({ _id: req.params.id, owner: req.user._id });
  if (!d) fail(404, "Document not found.");
  if ((d.workspace?.revision || 0) !== b.revision)
    fail(409, "This document changed. Reload before saving.");
  if (b.project) await projectAccess(req.user, b.project);
  if(JSON.stringify(b).length>150000)fail(400,'This workspace exceeds the 150,000 character limit. Split supplementary material into another draft.');
  if(new Set(b.modules.map(m=>m.key)).size!==b.modules.length || new Set(b.results.map(r=>r.key)).size!==b.results.length)fail(400,'Module and experiment identifiers must be unique.');
  const sources = [...new Set(b.modules.flatMap((m) => m.sourceIds))];
  if (
    sources.length !==
    (await Paper.countDocuments({ _id: { $in: sources }, owner: req.user._id }))
  )
    fail(403, "Only your own saved sources can be attached.");
  const resultKeys = new Set(b.results.map((r) => r.key));
  if (b.modules.some((m) => m.resultIds.some((k) => !resultKeys.has(k))))
    fail(400, "A linked experiment record is missing.");
  const versions = [
    ...(d.workspace?.versions || []),
    {
      at: new Date(),
      revision: d.workspace?.revision || 0,
      modules: d.workspace?.modules || [],
      results: d.workspace?.results || [],
      template: d.workspace?.template,
      content: d.content,
    },
  ].slice(-20);
  const bibliography = await Paper.find({
    _id: { $in: sources },
    owner: req.user._id,
  }).lean();
  d.workspace = { ...b, revision: b.revision + 1, versions };
  d.content =
    b.modules.map((m) => `${m.title}\n\n${m.text}`).join("\n\n") +
    (bibliography.length
      ? "\n\nLinked references\n" +
        bibliography
          .map(
            (p) =>
              `[PX-${String(p._id).slice(-6)}] ${p.authors || ""} (${p.year || "n.d."}). ${p.title}. ${p.doi ? "https://doi.org/" + p.doi : p.url || ""}`,
          )
          .join("\n")
      : "");
  d.markModified("workspace");
  await d.save();
  res.json(d);
});
authorWorkspace.get("/author/projects/:id/plan", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id);
  res.json({ plan: p.plan || {}, project: p });
});
authorWorkspace.put("/author/projects/:id/plan", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id);
  if(String(p.owner)!==String(req.user._id)&&!req.user.roles.some(r=>['researcher','admin'].includes(r)))fail(403,'Only the owner, assigned supervisor or administrator may edit the research plan.');
  const plan = parse(
    z.object({
      sections: z.record(z.string().max(100), z.string().max(12000)),
    }),
    req,
  );
  p.plan = plan;
  p.markModified("plan");
  await p.save();
  res.json({ plan: p.plan, project: p });
});
authorWorkspace.post("/author/catalog/:id/save", async (req, res) => {
  id.parse(req.params.id);
  const r = await CuratedRecord.findOne({
    _id: req.params.id,
    kind: "publications",
  });
  if (!r) fail(404, "Publication not found.");
  const d = r.data;
  const filter = {
    owner: req.user._id,
    ...(d.doi ? { doi: d.doi } : { url: r.sourceUrl }),
  };
  const p = await Paper.findOneAndUpdate(
    filter,
    {
      $setOnInsert: {
        ...filter,
        title: d.title,
        authors: (d.authors || []).join(", "),
        year: d.year,
        abstract: d.summary,
        url: r.sourceUrl,
        source: `Content pack; ${r.checkStatus}`,
        methodology: evidenceText(d.methodology),
        findings: evidenceText(d.findings),
        limitations: evidenceText(d.limitations_and_review_fields),
        notes: `Publication status: ${d.status}. Source-pack annotations; review against the original before citing.`,
        collection: "Author workspace sources",
        synthetic: false,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  res.json(p);
});
