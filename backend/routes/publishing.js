import { Router } from "express";
import { z } from "zod";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  Journal,
  Manuscript,
  Version,
  Assignment,
  Review,
  Issue,
  User,
  Audit,
  ManuscriptFile,
} from "../models/index.js";
import { auth, hasRole, allow } from "../middleware/auth.js";
import {
  text,
  id,
  date,
  parse,
  fail,
  same,
  page,
  search,
} from "../utils/http.js";
import { manuscriptAccess, canEditJournal } from "../services/access.js";
import { upload, extract, storeFile, docxBuffer } from "../services/files.js";
import { notify } from "../services/notifications.js";
import { env } from "../config/env.js";
import { manuscriptScope, selectedRole } from '../services/workspaces.js';
import { changeEditorialStatus } from '../services/editorial.js';
import { audit, expireInvitations } from '../services/lifecycle.js';
import { editorialOf, productionOf, publicationOf } from '../../shared/workspaces.js';
import { installWorkflowRoutes } from './workflow.js';
export const publishing = Router();
publishing.use((req, res, next) =>
  /^\/(journals|articles|manuscripts|reviewers|review-assignments|editorial|assignments|issues)(\/|$)/.test(
    req.path,
  )
    ? next()
    : next("router"),
);
publishing.get("/journals", async (req, res) =>
  res.json(
    await Journal.find({ name: search(req.query.q), synthetic: { $ne: true } })
      .select("-editors")
      .sort({ name: 1 })
      .skip(page(req).skip)
      .limit(page(req).limit),
  ),
);
publishing.get("/journals/:id", async (req, res) => {
  id.parse(req.params.id);
  const j = await Journal.findOne({_id:req.params.id,synthetic:{$ne:true}}).populate(
    "editors",
    "name affiliation",
  );
  if (!j) fail(404, "Journal not found.");
  res.json({
    journal: j,
    articles: await Manuscript.find({ journal: j._id, status: "published",synthetic:{$ne:true} })
      .select("title abstract code doi publishedAt synthetic")
      .limit(100),
    issues: await Issue.find({ journal: j._id }).sort({
      volume: -1,
      number: -1,
    }),
  });
});
publishing.get("/articles/:id", async (req, res) => {
  id.parse(req.params.id);
  const m = await Manuscript.findOne({
    _id: req.params.id,
    status: "published",
    synthetic: { $ne: true },
  })
    .populate("journal", "name")
    .populate("author", "name affiliation")
    .populate("issue");
  if (!m) fail(404, "Article not found.");
  const finalProof=await ManuscriptFile.findOne({manuscript:m._id,kind:'proof',state:'approved'}).sort({createdAt:-1}).select('text');
  const v = await Version.findOne({
    manuscript: m._id,
    number: m.acceptedVersion || m.currentVersion,
  }).select("text");
  res.json({
    article: {
      _id: m._id,
      title: m.title,
      abstract: m.abstract,
      keywords: m.keywords,
      author: m.author,
      coauthors: m.coauthors,
      journal: m.journal,
      issue: m.issue,
      doi: m.doi,
      doiStatus: m.doiStatus,
      publishedAt: m.publishedAt,
      synthetic: m.synthetic,
    },
    text: finalProof?.text || v?.text,
  });
});
publishing.get('/articles/:id/file',async(req,res)=>{
 id.parse(req.params.id);
 const m=await Manuscript.findOne({_id:req.params.id,publicationStatus:'published',status:'published',synthetic:{$ne:true}});
 if(!m||!m.qualityCheck?.file)fail(404,'Final publication file not available.');
 const f=await ManuscriptFile.findOne({_id:m.qualityCheck.file,manuscript:m._id,kind:'proof',state:'approved',version:m.acceptedVersion});
 if(!f)fail(404,'Final publication file not available.');
 res.download(path.join(env.uploads,path.basename(f.path)),f.filename);
});
publishing.use(auth);
installWorkflowRoutes(publishing);
publishing.get('/review-assignments', allow('reviewer'), async (req, res) => {
  await expireInvitations();
  res.json(await Assignment.find({reviewer:req.user._id})
    .populate({path:'manuscript',select:'title code abstract status editorialStatus currentVersion journal',populate:{path:'journal',select:'name reviewPolicy subject'}})
    .sort({due:1}).limit(200));
});
publishing.use(allow('researcher', 'reviewer', 'editor', 'publisher', 'admin'));
publishing.get("/manuscripts", async (req, res) => {
  const access = await manuscriptScope(req.user, req.query.workspace ? [selectedRole(req)] : req.user.roles);
  const q = {
    $and: [
      access,
      { title: search(req.query.q) },
      ...(req.query.status ? [{ status: String(req.query.status) }] : []),
    ],
  };
  res.json(
    await Manuscript.find(q)
      .select('code title abstract status editorialStatus productionStatus publicationStatus journal author currentVersion acceptedVersion acceptedAt submittedAt updatedAt handoff.at')
      .populate("journal", "name")
      .populate("author", "name")
      .sort({ updatedAt: -1 })
      .skip(page(req).skip)
      .limit(page(req).limit),
  );
});
publishing.post("/manuscripts", allow('researcher'), async (req, res) => {
  const b = parse(
    z.object({
      title: text(250),
      abstract: text(10000, 30),
      keywords: text(500, 0),
      journal: id,
      coauthors: text(2000, 0).optional(),
      declarations: z.object({
        ethics: text(3000),
        consent: text(3000),
        conflicts: text(3000),
        funding: text(3000),
        data: text(3000),
        ai: text(3000),
        contributions: text(3000),
      }),
    }),
    req,
  );
  if (!(await Journal.exists({ _id: b.journal, active:{$ne:false} })))
    fail(404, "Journal not found.");
  if(await Journal.exists({_id:b.journal,external:true}))fail(400,'This external journal accepts submissions on its official website.');
  const m = await Manuscript.create({
    ...b,
    editorialStatus:'draft',productionStatus:'not_started',publicationStatus:'not_published',
    author: req.user._id,
    code: `PX-${new Date().getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
    history: [
      { status: "draft", by: req.user._id, note: "Manuscript created" },
    ],
  });
  res.status(201).json(m);
});
publishing.get("/manuscripts/:id", async (req, res) => {
  const { m, owner, editor, production, assignment } = await manuscriptAccess(
    req.user,
    req.params.id,
  );
  await m.populate("journal", "name guidelines reviewPolicy");
  if (!assignment || editor || owner)
    await m.populate("author", "name affiliation");
  let reviews = [];
  if (editor)
    reviews = await Review.find({ manuscript: m._id }).populate(
      "reviewer",
      "name",
    );
  else if (
    owner &&
    [
      "revision",
      "accepted",
      "copyediting",
      "typesetting",
      "proofreading",
      "published",
      "rejected",
    ].includes(m.status)
  )
    reviews = await Review.find({ manuscript: m._id }).select(
      "recommendation scores authorComments createdAt -_id",
    );
  else if (assignment)
    reviews = await Review.find({ manuscript: m._id, reviewer: req.user._id });
  const versions = await Version.find({ manuscript: m._id })
    .select("-path")
    .sort({ number: -1 });
  const isReviewer = !!assignment && !owner && !editor && !production;
  const blind = m.journal.reviewPolicy?.model === 'double_blind';
  const visible = m.toObject();
  visible.editorialStatus = editorialOf(m);visible.productionStatus=productionOf(m);visible.publicationStatus=publicationOf(m);
  if(!editor) {
    visible.decisions=visible.decisions.map(({internalNote,...decision})=>decision);
    visible.screeningChecks=[];
  }
  let permittedVersions=versions;
  let files=await ManuscriptFile.find({manuscript:m._id}).select('-path -text').sort({createdAt:-1});
  if(isReviewer) {
    delete visible.author;delete visible.coauthors;delete visible.history;delete visible.decisions;delete visible.productionHistory;delete visible.handoff;delete visible.acceptedBy;delete visible.qualityCheck;
    visible.declarations = blind ? {ethics:m.declarations.ethics,conflicts:m.declarations.conflicts} : m.declarations;
    permittedVersions = ['accepted','completed'].includes(assignment.status) && !blind ? versions.filter(v=>v.number===assignment.round) : [];
    files = ['accepted','completed'].includes(assignment.status) ? files.filter(f=>f.version===assignment.round&&(blind?f.kind==='blinded':['blinded','supplement'].includes(f.kind))) : [];
  } else if(production&&!editor&&!owner) {
    permittedVersions=versions.filter(v=>v.number===m.acceptedVersion);files=files.filter(f=>['proof','production'].includes(f.kind));
  } else if(owner&&!editor) files=files.filter(f=>f.kind==='supplement'||f.kind==='proof'&&f.state!=='uploaded');
  res.json({manuscript:visible,versions:permittedVersions,files,reviews,
    assignments:editor ? await Assignment.find({manuscript:m._id}).select('-draft -draftHistory').populate('reviewer','name email') : assignment ? [assignment] : [],
    permissions:{owner,editor,production,reviewer:!!assignment}});
});
publishing.post(
  "/manuscripts/:id/versions",
  upload.single("file"),
  async (req, res) => {
    const { m } = await manuscriptAccess(req.user, req.params.id, "owner");
    if (!["draft", "revision"].includes(m.status))
      fail(
        409,
        "Versions can only be uploaded for a draft or requested revision.",
      );
    const response = z
      .string()
      .trim()
      .max(20000)
      .parse(req.body?.response || "");
    if (m.status === "revision" && !response)
      fail(400, "A point-by-point response is required for a revision.");
    const { text: content, ext } = await extract(req.file);
    const stored = await storeFile(req.file, ext);
    const session = await Manuscript.startSession();
    let version;
    try {
      await session.withTransaction(async () => {
        const current = await Manuscript.findOne({
          _id: m._id,
          status: m.status,
          currentVersion: m.currentVersion,
        }).session(session);
        if (!current) fail(409, "Manuscript changed. Refresh and try again.");
        [version] = await Version.create(
          [
            {
              manuscript: m._id,
              number: m.currentVersion + 1,
              filename: path.basename(req.file.originalname),
              path: stored,
              mime:
                ext === ".pdf"
                  ? "application/pdf"
                  : ext === ".docx"
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : "text/plain",
              size: req.file.size,
              text: content,
              response,
            },
          ],
          { session },
        );
        current.currentVersion++;
        await current.save({ session });
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({
      _id: version._id,
      number: version.number,
      filename: version.filename,
    });
  },
);
publishing.get(
  "/manuscripts/:id/versions/:version/download",
  async (req, res) => {
    const access=await manuscriptAccess(req.user, req.params.id);
    const journal=await Journal.findById(access.m.journal);
    if(access.assignment&&!access.owner&&!access.editor&&!access.production&&(journal.reviewPolicy?.model==='double_blind'||!['accepted','completed'].includes(access.assignment.status)))fail(403,'Only permitted review files can be downloaded after acceptance.');
    id.parse(req.params.version);
    const v = await Version.findOne({
      _id: req.params.version,
      manuscript: req.params.id,
    });
    if (!v) fail(404, "Version not found.");
    if(access.assignment&&!access.owner&&!access.editor&&!access.production&&v.number!==access.assignment.round)fail(403,'This version is outside your assignment.');
    if(access.production&&!access.editor&&!access.owner&&v.number!==access.m.acceptedVersion)fail(403,'Only the accepted version is available to production.');
    if (v.path)
      return res.download(
        path.join(env.uploads, path.basename(v.path)),
        v.filename,
      );
    res
      .type(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )
      .attachment(v.filename || "manuscript.docx")
      .send(await docxBuffer("Manuscript", v.text));
  },
);
publishing.post("/manuscripts/:id/status", changeEditorialStatus);
publishing.get('/reviewers',allow('editor'),async(req,res)=>{
  const reviewers=await User.find({roles:'reviewer',active:true,$or:[{name:search(req.query.q)},{interests:search(req.query.q)},{affiliation:search(req.query.q)}]}).select('name affiliation interests reviewerAvailable reviewerCapacity').limit(100).lean();
  res.json(await Promise.all(reviewers.map(async u=>({...u,workload:await Assignment.countDocuments({reviewer:u._id,status:{$in:['invited','accepted']}})}))));
});
publishing.post("/manuscripts/:id/assignments", async (req, res) => {
  if(!hasRole(req.user,'editor'))fail(403,'Only assigned Editors can invite reviewers.');
  const { m } = await manuscriptAccess(req.user, req.params.id, "editor");
  const b = parse(z.object({ reviewer: id, due: date, responseDue:date, invitationMessage:text(2000,0).optional() }), req);
  if (!["screening", "under_review"].includes(m.status))
    fail(
      409,
      "Move the manuscript to initial screening before inviting reviewers.",
    );
  if (same(m.author, b.reviewer))
    fail(400, "An author cannot review their own manuscript.");
  if (
    !(await User.exists({ _id: b.reviewer, roles: 'reviewer', active: true }))
  )
    fail(400, "Select an active reviewer.");
  if (!b.due || new Date(b.due) <= new Date())
    fail(400, "Choose a future review deadline.");
  b.responseDue=b.responseDue||new Date(Math.min(Date.now()+7*86400000,new Date(b.due).getTime()-3600000)).toISOString();
  if(new Date(b.responseDue)<=new Date()||new Date(b.responseDue)>=new Date(b.due))fail(400,'Response deadline must be in the future and before the review deadline.');
  const candidate=await User.findById(b.reviewer);
  if(candidate.reviewerAvailable===false)fail(409,'This reviewer is currently unavailable.');
  if(await Assignment.countDocuments({reviewer:candidate._id,status:{$in:['invited','accepted']}})>=(candidate.reviewerCapacity||3))fail(409,'This reviewer has reached their preferred active workload.');
  const a = await Assignment.create({
    ...b,
    manuscript: m._id,
    editor: req.user._id,
    round: m.currentVersion,
  });
  await notify(
    b.reviewer,
    "Peer review invitation",
    `You have been invited to review ${m.code}. Respond by opening the manuscript.`,
    `/manuscripts/${m._id}`,
    "review",
  );
  res.status(201).json(a);
});
publishing.patch("/assignments/:id", allow('reviewer'), async (req, res) => {
  id.parse(req.params.id);
  await expireInvitations();
  const b = parse(z.object({ status: z.enum(["accepted", "declined"]),conflictDeclared:z.boolean().optional(),responseReason:text(2000,0).optional() }), req);
  if(b.status==='accepted'&&b.conflictDeclared!==false)fail(400,'Confirm that you have no conflict of interest before accepting.');
  const a = await Assignment.findOneAndUpdate(
    { _id: req.params.id, reviewer: req.user._id, status: "invited" },
    { $set: {...b,respondedAt:new Date()},$push:{events:{action:b.status,at:new Date(),by:req.user._id,note:b.responseReason}} },
    { returnDocument: "after" },
  );
  if (!a) fail(404, "Pending invitation not found.");
  await audit(req.user,`review.invitation_${b.status}`,'Manuscript',a.manuscript);
  await notify(
    a.editor,
    `Review invitation ${b.status}`,
    "The reviewer has responded to your invitation.",
    `/manuscripts/${a.manuscript}`,
    "review",
  );
  res.json(a);
});
publishing.post("/assignments/:id/review", allow('reviewer'), async (req, res) => {
  id.parse(req.params.id);
  const score = z.number().int().min(1).max(5);
  const b = parse(
    z.object({
      recommendation: z.enum([
        "accept",
        "minor_revision",
        "major_revision",
        "reject",
      ]),
      scores: z.object({
        originality: score,
        methodology: score,
        results: score,
        presentation: score,
      }),
      authorComments: text(20000, 20),
      confidentialComments: text(20000, 0).default(""),
    }),
    req,
  );
  const a = await Assignment.findOne({
    _id: req.params.id,
    reviewer: req.user._id,
    status: "accepted",
  });
  if (!a) fail(403, "Accept the invitation before submitting a review.");
  const m = await Manuscript.findById(a.manuscript);
  if (m.status !== "under_review" || a.round !== m.currentVersion)
    fail(409, "This review round is not open.");
  const session = await Review.startSession();
  let review;
  try {
    await session.withTransaction(async () => {
      [review] = await Review.create(
        [
          {
            ...b,
            assignment: a._id,
            manuscript: a.manuscript,
            reviewer: req.user._id,
          },
        ],
        { session },
      );
      await Assignment.updateOne(
        { _id: a._id, status:'accepted' },
        { $set: { status: "completed",submittedAt:new Date() } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  await notify(
    a.editor,
    "Peer review submitted",
    `A review is ready for ${m.code}.`,
    `/manuscripts/${m._id}`,
    "review",
  );
  await audit(req.user,'review.submitted','Manuscript',m._id);
  res.status(201).json(review);
});
publishing.get("/issues", async (req, res) => {
  id.parse(req.query.journal);
  if (!(await canEditJournal(req.user, req.query.journal)))
    fail(403, "Journal access denied.");
  res.json(await Issue.find({ journal: req.query.journal }));
});
publishing.post("/issues", allow("publisher"), async (req, res) => {
  const b = parse(
    z.object({
      journal: id,
      volume: z.number().int().positive(),
      number: z.number().int().positive(),
      title: text(200),
    }),
    req,
  );
  if (!(await canEditJournal(req.user, b.journal)))
    fail(403, "Journal access denied.");
  res.status(201).json(await Issue.create(b));
});
