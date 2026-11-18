import { Router } from "express";
import { z } from "zod";
import {
  Project,
  Task,
  Paper,
  User,
  Document,
  Audit,
} from "../models/index.js";
import { projectAccess } from "../services/access.js";
import { notify } from "../services/notifications.js";
import { docxBuffer } from "../services/files.js";
import { auth,allow,hasRole } from "../middleware/auth.js";
import {
  id,
  text,
  date,
  parse,
  fail,
  page,
  search,
  same,
} from "../utils/http.js";
export const research = Router();
research.use(auth);
research.use((req,res,next)=>{
  if (/^\/(papers|documents|researchers)(\/|$)/.test(req.path)) return allow('researcher')(req,res,next);
  if (/^\/(projects|tasks)(\/|$)/.test(req.path)) return allow('researcher','admin')(req,res,next);
  next();
});
const projectFields = z.object({
  title: text(200),
  description: text(5000, 0).default(""),
  domain: text(100, 0).default(""),
  objectives: text(5000, 0).default(""),
  due: date,
  status: z.enum(["active", "paused", "completed"]).optional(),
});
research.get("/projects", async (req, res) => {
  if(!hasRole(req.user,'researcher','admin'))return res.json([]);
  const items = await Project.find({
    ...(!hasRole(req.user,'admin')?{$or: [{ owner: req.user._id }, { members: req.user._id }]}:{}),
    title: search(req.query.q),
  })
    .populate("members", "name affiliation")
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();
  const tasks = await Task.find({ project: { $in: items.map((p) => p._id) } });
  res.json(
    items.map((p) => ({
      ...p,
      tasks: tasks.filter((t) => same(t.project, p._id)),
    })),
  );
});
research.post("/projects", allow('researcher'), async (req, res) =>
  res
    .status(201)
    .json(
      await Project.create({
        ...parse(projectFields, req),
        owner: req.user._id,
      }),
    ),
);
research.get("/projects/:id", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id);
  await p.populate("members", "name email affiliation");
  await p.populate("feedback.by", "name");
  res.json({
    project: p,
    tasks: await Task.find({ project: p._id }).sort({ createdAt: -1 }),
  });
});
research.patch("/projects/:id", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id, true);
  Object.assign(p, parse(projectFields.partial(), req));
  await p.save();
  res.json(p);
});
research.delete("/projects/:id", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id, true);
  const session = await Project.startSession();
  try {
    await session.withTransaction(async () => {
      await Task.deleteMany({ project: p._id }, { session });
      await Project.deleteOne({ _id: p._id }, { session });
    });
  } finally {
    await session.endSession();
  }
  res.json({ ok: true });
});
research.post("/projects/:id/tasks", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id);
  const b = parse(
    z.object({
      title: text(200),
      due: date,
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      milestone: z.boolean().default(false),
      assignee: id.nullable().optional(),
    }),
    req,
  );
  if(b.assignee && ![p.owner,...p.members].some(u=>same(u,b.assignee)))fail(400,'Assign tasks only to the project owner or a member.');
  const t = await Task.create({ ...b, project: p._id });
  if(b.assignee)await notify(b.assignee,'Research task assigned',t.title,`/projects/${p._id}`,'task');
  res.status(201).json(t);
});
research.patch("/tasks/:id", async (req, res) => {
  id.parse(req.params.id);
  const t = await Task.findById(req.params.id);
  if (!t) fail(404, "Task not found.");
  const p = await projectAccess(req.user, t.project.toString());
  const b = parse(
    z.object({
      title: text(200).optional(),
      status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      due: date,
      assignee: id.nullable().optional(),
    }),
    req,
  );
  if(b.assignee && ![p.owner,...p.members].some(u=>same(u,b.assignee)))fail(400,'Assign tasks only to the project owner or a member.');
  const reassigned=b.assignee && !same(t.assignee,b.assignee);
  Object.assign(t, b);
  await t.save();
  if(reassigned)await notify(b.assignee,'Research task assigned',t.title,`/projects/${p._id}`,'task');
  if (b.status === "done")
    await notify(
      p.owner,
      "Research task completed",
      t.title,
      `/projects/${p._id}`,
      "task",
    );
  res.json(t);
});
research.delete("/tasks/:id", async (req, res) => {
  id.parse(req.params.id);
  const t = await Task.findById(req.params.id);
  if (!t) fail(404, "Task not found.");
  await projectAccess(req.user, String(t.project));
  await t.deleteOne();
  res.json({ ok: true });
});
research.post("/projects/:id/members", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id, true);
  const b = parse(z.object({ email: z.string().email() }), req);
  const u = await User.findOne({ email: b.email.toLowerCase(), active: true });
  if (!u) fail(404, "No active researcher has this email.");
  if(!hasRole(u,'researcher'))fail(400,'Project members must be Researchers or Supervisors.');
  if (!same(p.owner, u._id) && !p.members.some((m) => same(m, u._id)))
    p.members.push(u._id);
  await p.save();
  await notify(
    u,
    "Research collaboration invitation",
    `You have been added to “${p.title}”. You can leave from the project workspace.`,
    `/projects/${p._id}`,
    "collaboration",
  );
  res.json({ ok: true });
});
research.delete("/projects/:id/members/:member", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id);
  id.parse(req.params.member);
  if (!same(p.owner, req.user._id) && !same(req.params.member, req.user._id))
    fail(403, "You can only remove yourself.");
  p.members = p.members.filter((m) => !same(m, req.params.member));
  await p.save();
  res.json({ ok: true });
});
research.post("/projects/:id/feedback", async (req, res) => {
  const p = await projectAccess(req.user, req.params.id);
  const b = parse(z.object({ text: text(5000) }), req);
  p.feedback.push({ ...b, by: req.user._id });
  await p.save();
  await notify(
    p.owner,
    "New project feedback",
    `${req.user.name} commented on ${p.title}.`,
    `/projects/${p._id}`,
    "collaboration",
  );
  res.json(p);
});
research.get("/papers/search", async (req, res) => {
  const q = z.string().trim().min(2).max(200).parse(req.query.q);
  const params = new URLSearchParams({ query: q, rows: "20" });
  if (req.query.year && /^\d{4}$/.test(req.query.year))
    params.set(
      "filter",
      `from-pub-date:${req.query.year}-01-01,until-pub-date:${req.query.year}-12-31`,
    );
  try {
    const response = await fetch(`https://api.crossref.org/works?${params}`, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Publixia/1.0 (academic research discovery)" },
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    res.json({
      source: "Crossref",
      papers: data.message.items.map((p) => ({
        title: p.title?.[0] || "Untitled",
        authors: (p.author || [])
          .map((a) => `${a.given || ""} ${a.family || ""}`.trim())
          .join(", "),
        year: p.published?.["date-parts"]?.[0]?.[0],
        doi: p.DOI,
        url: p.URL,
        abstract: (p.abstract || "").replace(/<[^>]+>/g, ""),
        source: "Crossref",
      })),
    });
  } catch {
    res
      .status(503)
      .json({
        error:
          "Crossref is currently unavailable. Your saved library remains available.",
        source: "unavailable",
      });
  }
});
const paperFields = z.object({
  title: text(500),
  authors: text(3000, 0).default(""),
  year: z.number().int().min(1600).max(2200).optional(),
  doi: text(300).optional(),
  url: z
    .string()
    .url()
    .regex(/^https?:\/\//)
    .optional(),
  abstract: text(20000, 0).default(""),
  source: text(80).default("Manual entry"),
  notes: text(20000, 0).default(""),
  methodology: text(10000, 0).default(""),
  findings: text(10000, 0).default(""),
  limitations: text(10000, 0).default(""),
  collection: text(100, 0).default(""),
});
research.get("/papers", async (req, res) =>
  res.json(
    await Paper.find({ owner: req.user._id, synthetic:{$ne:true}, title: search(req.query.q) })
      .sort({ updatedAt: -1 })
      .skip(page(req).skip)
      .limit(page(req).limit),
  ),
);
research.post("/papers", async (req, res) =>
  res
    .status(201)
    .json(
      await Paper.create({ ...parse(paperFields, req), owner: req.user._id }),
    ),
);
research.patch("/papers/:id", async (req, res) => {
  id.parse(req.params.id);
  const p = await Paper.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: parse(paperFields.partial(), req) },
    { returnDocument: "after" },
  );
  if (!p) fail(404, "Paper not found.");
  res.json(p);
});
research.delete("/papers/:id", async (req, res) => {
  id.parse(req.params.id);
  await Paper.deleteOne({ _id: req.params.id, owner: req.user._id });
  res.json({ ok: true });
});
research.get("/papers/:id/citation", async (req, res) => {
  id.parse(req.params.id);
  const p = await Paper.findOne({ _id: req.params.id, owner: req.user._id });
  if (!p) fail(404, "Paper not found.");
  const clean = (s) => String(s || "").replace(/[{}\\\n\r]/g, " ");
  res
    .type("text/plain")
    .attachment("citation.bib")
    .send(
      `@article{publixia${p._id},\n  title = {${clean(p.title)}},\n  author = {${clean(p.authors)}},\n  year = {${p.year || ""}},\n  doi = {${clean(p.doi)}}\n}`,
    );
});
research.get("/researchers", async (req, res) =>
  res.json(
    await User.find({ active: true, demo:{$ne:true}, name: search(req.query.q) })
      .select("name affiliation interests bio roles demo")
      .limit(100),
  ),
);
const documentFields = z.object({
  title: text(200),
  type: z.enum([
    "paper",
    "abstract",
    "proposal",
    "presentation",
    "poster",
    "questionnaire",
  ]),
  content: text(100000, 0).default(""),
});
research.get("/documents", async (req, res) =>
  res.json(
    await Document.find({ owner: req.user._id })
      .select("-content")
      .select("-workspace")
      .sort({ updatedAt: -1 })
      .limit(100),
  ),
);
research.post("/documents", async (req, res) =>
  res
    .status(201)
    .json(
      await Document.create({
        ...parse(documentFields, req),
        owner: req.user._id,
      }),
    ),
);
research.get("/documents/:id", async (req, res) => {
  id.parse(req.params.id);
  const d = await Document.findOne({ _id: req.params.id, owner: req.user._id });
  if (!d) fail(404, "Document not found.");
  res.json(d);
});
research.patch("/documents/:id", async (req, res) => {
  id.parse(req.params.id);
  const existing=await Document.findOne({_id:req.params.id,owner:req.user._id});
  if(!existing)fail(404,'Document not found.');
  if(existing.workspace && req.body.content!==undefined)fail(409,'Edit this structured document in Writing Studio to preserve its modules and history.');
  const d = await Document.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: parse(documentFields.partial(), req) },
    { returnDocument: "after" },
  );
  if (!d) fail(404, "Document not found.");
  res.json(d);
});
research.delete("/documents/:id", async (req, res) => {
  id.parse(req.params.id);
  await Document.deleteOne({ _id: req.params.id, owner: req.user._id });
  res.json({ ok: true });
});
research.get("/documents/:id/export", async (req, res) => {
  id.parse(req.params.id);
  const d = await Document.findOne({ _id: req.params.id, owner: req.user._id });
  if (!d) fail(404, "Document not found.");
  res
    .type(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    .attachment("publixia-document.docx")
    .send(await docxBuffer(d.title, d.content));
});
