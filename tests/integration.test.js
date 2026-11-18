import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../backend/config/env.js";
import { createApp } from "../backend/app.js";
import * as M from "../backend/models/index.js";
import { generate } from "../backend/services/ai.js";
import { correctedText } from "../backend/routes/ai.js";
import { notify, deliverBatch } from "../backend/services/notifications.js";
import { createReminders } from "../backend/jobs/reminders.js";
import { extract } from "../backend/services/files.js";
import { Criteria } from "../backend/routes/intelligence.js";
import {CuratedRecord} from '../backend/routes/author.js';
let mongo,
  app,
  author,
  outsider,
  editor,
  reviewer,
  reviewer2,
  publisher,
  admin,
  authorUser,
  reviewerUser,
  editorUser,
  reviewer2User,
  journal,
  mid,
  assignment,
  report,
  project,
  tmp;
const password = "IntegrationTest!2026";
test('supervisor task assignments persist, notify recipients and reject unrelated assignees',async()=>{
 const p=await M.Project.create({owner:authorUser._id,title:'Task assignment check',members:[editorUser._id]});
 const t=await editor.post(`/api/projects/${p._id}/tasks`).send({title:'Check evidence provenance',assignee:String(authorUser._id)}).expect(201);
 assert.equal(t.body.assignee,String(authorUser._id));
 assert.ok(await M.Notification.exists({user:authorUser._id,title:'Research task assigned',body:'Check evidence provenance'}));
 await editor.patch(`/api/tasks/${t.body._id}`).send({assignee:String(reviewer2User._id)}).expect(400);
 await editor.patch(`/api/tasks/${t.body._id}`).send({assignee:String(editorUser._id)}).expect(200);
 await outsider.patch(`/api/tasks/${t.body._id}`).send({assignee:null}).expect(403);
 await M.Task.deleteOne({_id:t.body._id});await M.Project.deleteOne({_id:p._id});
});
test('five roles reject retired labels, protect profiles and separate publishing from editorial authority',async()=>{
 assert.deepEqual([...M.roles].sort(),['admin','editor','publisher','researcher','reviewer']);
 await admin.patch(`/api/admin/users/${authorUser._id}`).send({roles:['student']}).expect(400);
 const profile=await author.patch('/api/auth/me').send({academicStatus:'postgraduate',roles:['admin']}).expect(200);
 assert.equal(profile.body.user.academicStatus,'postgraduate');assert.deepEqual(profile.body.user.roles,['researcher']);
 await reviewer2.post('/api/projects').send({title:'Forbidden project'}).expect(403);
 const m=await M.Manuscript.create({author:authorUser._id,journal:journal._id,title:'Role boundary test',code:'ROLE-TEST',status:'submitted'});
 await publisher.post(`/api/manuscripts/${m._id}/status`).send({status:'screening'}).expect(403);
 await publisher.post(`/api/manuscripts/${m._id}/assignments`).send({}).expect(403);
 await M.Manuscript.deleteOne({_id:m._id});
});
test('journal administration and activity enforce assigned scope',async()=>{
 await author.get('/api/governance/journals').expect(403);
 const j=(await admin.post('/api/governance/journals').send({name:'Governance journal',slug:'governance-journal'}).expect(201)).body;
 await editor.patch(`/api/governance/journals/${j._id}`).send({guidelines:'Unauthorized'}).expect(403);
 await admin.patch(`/api/governance/journals/${j._id}`).send({editors:[String(editorUser._id)]}).expect(200);
 await editor.patch(`/api/governance/journals/${j._id}`).send({guidelines:'Report limitations and ethics.'}).expect(200);
 await editor.patch(`/api/governance/journals/${j._id}`).send({editors:[]}).expect(403);
 const activity=(await outsider.get('/api/governance/activity').expect(200)).body;assert.equal(activity.some(a=>a.resourceId===j._id),false);
 await M.Journal.deleteOne({_id:j._id});
});
test('author workspace preserves modules and references, rejects foreign evidence and stale revisions',async()=>{
 const paper=await M.Paper.create({owner:authorUser._id,title:'Owned evidence',doi:'10.1234/evidence',authors:'Research Author',year:2026});
 const foreign=await M.Paper.create({owner:editorUser._id,title:'Private evidence'});
 const d=(await author.post('/api/documents').send({title:'Structured test',type:'paper',content:'Original content'}).expect(201)).body;
 const body={revision:0,template:'Original research article',modules:[{key:'intro',title:'Introduction',text:'Evidence-supported research question.',status:'draft',sourceIds:[String(paper._id)],resultIds:[]}],results:[]};
 await outsider.put(`/api/author/documents/${d._id}`).send(body).expect(404);
 await author.put(`/api/author/documents/${d._id}`).send({...body,modules:[{...body.modules[0],sourceIds:[String(foreign._id)]}]}).expect(403);
 const saved=(await author.put(`/api/author/documents/${d._id}`).send(body).expect(200)).body;
 assert.equal(saved.workspace.revision,1);assert.match(saved.content,/10.1234\/evidence/);assert.equal(saved.workspace.versions[0].content,'Original content');
 await author.put(`/api/author/documents/${d._id}`).send(body).expect(409);
 await author.patch(`/api/documents/${d._id}`).send({content:'Overwrite sections'}).expect(409);
 await author.get(`/api/documents/${d._id}/export`).expect(200);
 await author.put(`/api/author/documents/${d._id}`).send({...body,revision:1,modules:[{...body.modules[0],resultIds:['missing']}]}).expect(400);
 await M.Paper.deleteMany({_id:{$in:[paper._id,foreign._id]}});
});
test('research plans and active context enforce project access',async()=>{
 const p=await M.Project.create({owner:authorUser._id,title:'Private plan',members:[editorUser._id]});
 await outsider.put('/api/author/context').send({project:String(p._id)}).expect(403);
 await author.put('/api/author/context').send({project:String(p._id)}).expect(200);
 await author.put(`/api/author/projects/${p._id}/plan`).send({sections:{Question:'Does the intervention improve recall?'}}).expect(200);
 const r=await author.get('/api/author/context').expect(200);assert.equal(r.body.project.plan.sections.Question,'Does the intervention improve recall?');
 await editor.get(`/api/author/projects/${p._id}/plan`).expect(200);
 await editor.put(`/api/author/projects/${p._id}/plan`).send({sections:{}}).expect(200);
 await outsider.get(`/api/author/projects/${p._id}/plan`).expect(403);
 await author.put('/api/author/context').send({project:null}).expect(200);
 await M.Project.deleteOne({_id:p._id});
});
test('source imports normalize structured findings and save idempotently; follows are private',async()=>{
 const r=await CuratedRecord.create({key:'test-paper',kind:'publications',sourceUrl:'https://example.test/paper',data:{title:'Catalog paper',authors:['One Author'],doi:'10.1234/test-source',findings:{note:'Author reported claim'},status:'preprint'}});
 await request(app).get('/api/author/catalog?kind=publications').expect(200);
 await request(app).get('/api/research/discover?provider=invalid').expect(400);
 const first=await author.post(`/api/author/catalog/${r._id}/save`).expect(200);
 const second=await author.post(`/api/author/catalog/${r._id}/save`).expect(200);
 assert.equal(first.body._id,second.body._id);assert.match(first.body.findings,/Author reported claim/);
 const person=await CuratedRecord.create({key:'test-researcher',kind:'researchers',data:{name:'Source researcher'}});
 await author.put(`/api/author/catalog/${person._id}/follow`).send({following:true}).expect(200);
 assert.equal((await author.get('/api/author/following')).body.length,1);
 assert.equal((await outsider.get('/api/author/following')).body.length,0);
 await author.put(`/api/author/catalog/${person._id}/follow`).send({following:false}).expect(200);
 await M.Paper.deleteOne({_id:first.body._id});
});
test('AI evidence selection requires consent and source ownership',async()=>{
 const p=await M.Paper.create({owner:authorUser._id,title:'Selected source'});
 const foreign=await M.Paper.create({owner:editorUser._id,title:'Confidential source'});
 const c=(await author.post('/api/ai/conversations').send({assistant:'ethics'}).expect(201)).body;
 await author.post(`/api/ai/conversations/${c._id}/messages`).send({message:'Assess evidence',sourceIds:[String(p._id)]}).expect(400);
 await author.post(`/api/ai/conversations/${c._id}/messages`).send({message:'Assess evidence',includeContext:true,sourceIds:[String(foreign._id)]}).expect(403);
 const reply=await author.post(`/api/ai/conversations/${c._id}/messages`).send({message:'Assess evidence',includeContext:true,sourceIds:[String(p._id)]}).expect(200);
 assert.deepEqual(reply.body.messages[0].sourceIds,[String(p._id)]);
 await M.Paper.deleteMany({_id:{$in:[p._id,foreign._id]}});
});
test('targeted email delivery only sends explicitly selected jobs',async()=>{
  const selected=await notify(authorUser,'Selected setup','Selected setup body');
  const unrelated=await notify(authorUser,'Unrelated notice','Leave this pending');
  let sent=0;
  await deliverBatch({jobIds:[selected._id],limit:5,transport:{sendMail:async()=>{sent++;return {accepted:['recipient@example.test']};}}});
  assert.equal(sent,1);
  assert.equal((await M.Notification.findById(selected._id)).email.state,'sent');
  assert.equal((await M.Notification.findById(unrelated._id)).email.state,'pending');
  await M.Notification.deleteMany({_id:{$in:[selected._id,unrelated._id]}});
});
test("authority criteria require admin, validate input and preserve version history", async () => {
  await author.post("/api/intelligence/criteria").send({}).expect(403);
  await admin
    .post("/api/intelligence/criteria")
    .send({ name: "x" })
    .expect(400);
  const body = {
    name: "Cybersecurity standard",
    domain: "Cybersecurity",
    instructions:
      "Assess threat model, attack scenarios, data leakage and reproducibility.",
    published: true,
    depth: "detailed",
    weights: { methodology: 40, evidence: 60 },
  };
  const first = await admin
    .post("/api/intelligence/criteria")
    .send(body)
    .expect(201);
  const second = await admin
    .post("/api/intelligence/criteria")
    .send({
      ...body,
      instructions: body.instructions + " Explain uncertainty.",
    })
    .expect(201);
  assert.notEqual(first.body._id, second.body._id);
  assert.equal(
    (await Criteria.findById(first.body._id)).instructions,
    body.instructions,
  );
  await author
    .post("/api/intelligence/sync")
    .send({ provider: "openalex" })
    .expect(403);
  await request(app)
    .get("/api/intelligence/search?provider=invalid")
    .expect(400);
});
const content =
  "This study have a clear objective.\nMethods\nThis is a synthetic document for testing.\nResults\nNo actual findings are claimed.";
const binary = (res, done) => {
  const chunks = [];
  res.on("data", (chunk) => chunks.push(chunk));
  res.on("end", () => done(null, Buffer.concat(chunks)));
};
before(async () => {
  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "8.2.3" },
  });
  await mongoose.connect(mongo.getUri("publixia_test"));
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "publixia-test-"));
  env.uploads = tmp;
  env.jwtSecret = "integration-test-secret-with-more-than-32-characters";
  env.geminiKey = "";
  app = createApp({
    generateAI: async (input) =>
      input.feature === "screening"
        ? JSON.stringify({
            summary: "Preliminary test report; no scientific assessment.",
            issues: [
              {
                category: "Grammar",
                original: "This study have",
                replacement: "This study has",
                explanation: "Subject-verb agreement.",
              },
              {
                category: "Grammar",
                original: "text absent from source",
                replacement: "ignored",
                explanation: "Unanchored suggestions must be dropped.",
              },
            ],
          })
        : "Test provider response; no live AI was called.",
  });
  const hash = await bcrypt.hash(password, 4);
  const setup = async (name, roles) => {
    const u = await M.User.create({
      name,
      email: `${name}@example.test`,
      passwordHash: hash,
      roles,
      emailVerified: true,
    });
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: u.email, password })
      .expect(200);
    return [agent, u];
  };
  [author, authorUser] = await setup("author", ["researcher"]);
  [outsider] = await setup("outsider", ["researcher"]);
  [editor, editorUser] = await setup("editor", ["editor", "researcher"]);
  [reviewer, reviewerUser] = await setup("reviewer", ["reviewer", "researcher"]);
  [reviewer2, reviewer2User] = await setup("reviewer2", ["reviewer"]);
  [publisher] = await setup("publisher", ["publisher"]);
  [admin] = await setup("admin", ["admin"]);
  const pub = await M.User.findOne({ email: "publisher@example.test" });
  journal = await M.Journal.create({
    name: "Test Journal",
    slug: "test-journal",
    guidelines: "State methods and limitations.",
    editors: [editorUser._id, pub._id],
  });
  await Promise.all(
    Object.values(M)
      .filter((v) => v?.modelName)
      .map((model) => model.init()),
  );
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  if (tmp) await fs.rm(tmp, { recursive: true, force: true });
});
test("public catalogs load anonymously; protected APIs reject missing and invalid sessions", async () => {
  await request(app).get("/api/journals").expect(200);
  await request(app).get("/api/courses").expect(200);
  await request(app).get("/api/projects").expect(401);
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "publixia_session=invalid")
    .expect(401);
});
test("registration hashes passwords, ignores privileged roles, and queues verification mail", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "New Researcher",
      email: "new@example.test",
      password,
      roles: ["admin"],
    })
    .expect(201);
  assert.deepEqual(response.body.user.roles, ["researcher"]);
  assert.ok(response.headers["set-cookie"][0].includes("HttpOnly"));
  const u = await M.User.findOne({ email: "new@example.test" }).select(
    "+passwordHash",
  );
  assert.notEqual(u.passwordHash, password);
  assert.equal(await bcrypt.compare(password, u.passwordHash), true);
  assert.equal(
    await M.Notification.countDocuments({ user: u._id, category: "account" }),
    1,
  );
  await request(app)
    .post("/api/auth/login")
    .send({ email: u.email, password: "incorrect" })
    .expect(401);
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Bad", email: "invalid", password: "short" })
    .expect(400);
});
test("registration email verification is single use; password reset invalidates existing sessions", async () => {
  const u = await M.User.findOne({ email: "new@example.test" });
  let n = await M.Notification.findOne({ user: u._id, category: "account" });
  const token = new URL(n.link, "http://localhost").searchParams.get("token");
  await request(app).post("/api/auth/verify-email").send({ token }).expect(200);
  await request(app).post("/api/auth/verify-email").send({ token }).expect(400);
  const old = request.agent(app);
  await old
    .post("/api/auth/login")
    .send({ email: u.email, password })
    .expect(200);
  await request(app)
    .post("/api/auth/forgot-password")
    .send({ email: u.email })
    .expect(200);
  n = await M.Notification.findOne({
    user: u._id,
    title: "Reset your password",
  });
  const reset = new URL(n.link, "http://localhost").searchParams.get("token");
  await request(app)
    .post("/api/auth/reset-password")
    .send({ token: reset, password: "ChangedPassword!2026" })
    .expect(200);
  await old.get("/api/auth/me").expect(401);
});
test("cross-origin writes and administrative privilege escalation are denied", async () => {
  await author
    .patch("/api/auth/me")
    .set("Origin", "https://untrusted.example")
    .send({ name: "X" })
    .expect(403);
  await author.get("/api/admin/overview").expect(403);
  await author
    .patch(`/api/admin/users/${reviewerUser._id}`)
    .send({ roles: ["admin"] })
    .expect(403);
});
test("expired JWTs and production demo logins are rejected", async () => {
  const expired = jwt.sign(
    { sub: String(authorUser._id), version: 0 },
    env.jwtSecret,
    { expiresIn: -1 },
  );
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", `publixia_session=${expired}`)
    .expect(401);
  const u = await M.User.create({
    name: "Demo security test",
    email: "demosecurity@example.test",
    passwordHash: await bcrypt.hash(password, 4),
    demo: true,
  });
  const prior = env.production;
  env.production = true;
  try {
    await request(app)
      .post("/api/auth/login")
      .send({ email: u.email, password })
      .expect(401);
  } finally {
    env.production = prior;
  }
});
test("create manuscript, reject missing file/submission, upload private version, and enforce ownership", async () => {
  const declarations = Object.fromEntries(
    [
      "ethics",
      "consent",
      "conflicts",
      "funding",
      "data",
      "ai",
      "contributions",
    ].map((k) => [k, "Synthetic test; not applicable."]),
  );
  const response = await author
    .post("/api/manuscripts")
    .send({
      title: "Testing a reproducible study",
      abstract:
        "A synthetic abstract with enough detail to exercise the real publication workflow.",
      keywords: "testing, reproducibility",
      journal: String(journal._id),
      declarations,
    })
    .expect(201);
  mid = response.body._id;
  await author
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "submitted" })
    .expect(400);
  await author.post(`/api/manuscripts/${mid}/versions`).expect(400);
  await author
    .post(`/api/manuscripts/${mid}/versions`)
    .attach("file", Buffer.from(content), "manuscript.txt")
    .expect(201);
  await outsider.get(`/api/manuscripts/${mid}`).expect(403);
  await reviewer.get(`/api/manuscripts/${mid}`).expect(403);
  const version = await M.Version.findOne({ manuscript: mid });
  await outsider
    .get(`/api/manuscripts/${mid}/versions/${version._id}/download`)
    .expect(403);
  await author
    .get(`/api/manuscripts/${mid}/versions/${version._id}/download`)
    .expect(200);
  await author
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "submitted" })
    .expect(200);
  await author
    .post(`/api/manuscripts/${mid}/versions`)
    .attach("file", Buffer.from(content), "another.txt")
    .expect(409);
  assert.ok(
    await M.Notification.exists({
      user: editorUser._id,
      title: "New manuscript submission",
    }),
  );
});
test("journal-scoped editor permissions, state transitions, reviewer acceptance and review submission", async () => {
  const unrelated = await M.User.create({
    name: "Other editor",
    email: "othereditor@example.test",
    roles: ["editor"],
    passwordHash: await bcrypt.hash(password, 4),
  });
  const agent = request.agent(app);
  await agent
    .post("/api/auth/login")
    .send({ email: unrelated.email, password })
    .expect(200);
  await agent.get(`/api/manuscripts/${mid}`).expect(403);
  await editor
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "published" })
    .expect(400);
  await editor
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "screening", note: "Complete submission received." })
    .expect(200);
  const ar = await editor
    .post(`/api/manuscripts/${mid}/assignments`)
    .send({ reviewer: String(reviewerUser._id), due: "2028-01-01" })
    .expect(201);
  assignment = ar.body._id;
  await editor
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "under_review" })
    .expect(409);
  await reviewer
    .patch(`/api/assignments/${assignment}`)
    .send({ status: "accepted", conflictDeclared:false })
    .expect(200);
  await editor.post(`/api/manuscripts/${mid}/screening-checklist`).send({checks:{scope:true,files:true,declarations:true,readability:true}}).expect(200);
  await editor
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "under_review" })
    .expect(200);
  const review = {
    recommendation: "major_revision",
    scores: { originality: 3, methodology: 4, results: 3, presentation: 4 },
    authorComments:
      "Please clarify the research assumptions and describe the limitations.",
    confidentialComments: "SECRET EDITOR ONLY",
  };
  await reviewer
    .post(`/api/assignments/${assignment}/review`)
    .send(review)
    .expect(201);
  await reviewer
    .post(`/api/assignments/${assignment}/review`)
    .send(review)
    .expect(403);
  let detail = await author.get(`/api/manuscripts/${mid}`).expect(200);
  assert.equal(detail.body.reviews.length, 0);
  await editor
    .post(`/api/manuscripts/${mid}/status`)
    .send({
      status: "revision",
      note: "Please address the methodological comments before resubmitting.",
    })
    .expect(200);
  detail = await author.get(`/api/manuscripts/${mid}`).expect(200);
  assert.equal(detail.body.reviews[0].authorComments, review.authorComments);
  assert.ok(!JSON.stringify(detail.body).includes("SECRET EDITOR ONLY"));
  assert.equal(detail.body.reviews[0].reviewer, undefined);
});
test("revision requires a new version with response; publication requires human review and publisher access", async () => {
  await author
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "submitted" })
    .expect(400);
  await author
    .post(`/api/manuscripts/${mid}/versions`)
    .field("response", "Addressed the review by clarifying assumptions.")
    .attach("file", Buffer.from(content + "\nRevised methods."), "revision.txt")
    .expect(201);
  await author
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "submitted" })
    .expect(200);
  await editor
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "screening" })
    .expect(200);
  const a = await editor
    .post(`/api/manuscripts/${mid}/assignments`)
    .send({ reviewer: String(reviewerUser._id), due: "2028-02-01" })
    .expect(201);
  await reviewer
    .patch(`/api/assignments/${a.body._id}`)
    .send({ status: "accepted", conflictDeclared:false })
    .expect(200);
  await editor.post(`/api/manuscripts/${mid}/screening-checklist`).send({checks:{scope:true,files:true,declarations:true,readability:true}}).expect(200);
  await editor
    .post(`/api/manuscripts/${mid}/status`)
    .send({ status: "under_review" })
    .expect(200);
  await reviewer
    .post(`/api/assignments/${a.body._id}/review`)
    .send({
      recommendation: "accept",
      scores: { originality: 4, methodology: 4, results: 4, presentation: 4 },
      authorComments: "The revision addresses the specified concerns.",
    })
    .expect(201);
  await editor.post(`/api/manuscripts/${mid}/status`).send({status:'accepted',note:'The current revision satisfies editorial and review requirements.'}).expect(200);
  await editor.post(`/api/manuscripts/${mid}/production`).send({status:'copyediting',note:'Trying an unauthorized production action.'}).expect(403);
  await admin.post(`/api/manuscripts/${mid}/production`).send({status:'copyediting',note:'Trying an unauthorized administrative production action.'}).expect(403);
  for(const status of ['copyediting','typesetting'])await publisher.post(`/api/manuscripts/${mid}/production`).send({status,note:'Formatting and production checks in progress.'}).expect(200);
  await publisher.post(`/api/manuscripts/${mid}/files`).field('kind','production').attach('file',Buffer.from(content+'\nRevised methods.'),'formatted.txt').expect(201);
  await publisher.post(`/api/manuscripts/${mid}/production`).send({status:'proof_preparation',note:'Production file is ready for author proof.'}).expect(200);
  const proof=(await publisher.post(`/api/manuscripts/${mid}/files`).field('kind','proof').attach('file',Buffer.from(content+'\nRevised methods.'),'proof.txt').expect(201)).body;
  await publisher.post(`/api/manuscripts/${mid}/proofs/${proof._id}/send`).send({}).expect(200);
  const issue=(await publisher.post('/api/issues').send({journal:String(journal._id),volume:1,number:1,title:'Test issue'}).expect(201)).body;
  const publication={status:'published',issue:issue._id,note:'Final publication quality checks complete.',checks:{files:true,metadata:true,proof:true,declarations:true}};
  await publisher.post(`/api/manuscripts/${mid}/production`).send(publication).expect(409);
  await outsider.post(`/api/manuscripts/${mid}/proofs/${proof._id}/respond`).send({decision:'approved'}).expect(403);
  await author.post(`/api/manuscripts/${mid}/proofs/${proof._id}/respond`).send({decision:'approved',note:'I approve this exact proof.'}).expect(200);
  const beforeReady=(await publisher.get('/api/operations/publisher').expect(200)).body;
  assert.equal(beforeReady.records.find(m=>m._id===mid).stage,'in_production');
  await author.post(`/api/manuscripts/${mid}/quality-check`).send({}).expect(403);
  await publisher.post(`/api/manuscripts/${mid}/quality-check`).send({issue:issue._id,checks:publication.checks}).expect(200);
  const ready=(await publisher.get('/api/operations/publisher').expect(200)).body;
  assert.equal(ready.records.find(m=>m._id===mid).stage,'ready');
  assert.equal(ready.counts.ready,ready.records.filter(m=>m.stage==='ready').length);
  await editor.post(`/api/manuscripts/${mid}/production`).send(publication).expect(403);
  await publisher.post(`/api/manuscripts/${mid}/production`).send(publication).expect(200);
  const states=await M.Manuscript.findById(mid);assert.equal(states.editorialStatus,'accepted');assert.equal(states.productionStatus,'published');assert.equal(states.publicationStatus,'published');assert.equal(states.acceptedVersion,2);
  assert.equal((await publisher.get(`/api/manuscripts/${mid}`)).body.reviews.length,0);
  const publicArticle = await request(app)
    .get(`/api/articles/${mid}`)
    .expect(200);
  assert.ok(publicArticle.body.text.includes("Revised methods."));
  assert.equal(publicArticle.body.article.status, undefined);
  assert.equal(await M.Version.countDocuments({ manuscript: mid }), 2);
});
test("AI chat persists, isolates users, and sends authorized context only when selected", async () => {
  const c = await author
    .post("/api/ai/conversations")
    .send({ assistant: "mentor" })
    .expect(201);
  const r = await author
    .post(`/api/ai/conversations/${c.body._id}/messages`)
    .send({ message: "Help plan research.", includeContext: false })
    .expect(200);
  assert.equal(r.body.messages.length, 2);
  await outsider.get(`/api/ai/conversations/${c.body._id}`).expect(404);
  await author
    .patch(`/api/ai/conversations/${c.body._id}`)
    .send({ title: "Research planning" })
    .expect(200);
});
test("a second assigned reviewer cannot read another reviewer’s confidential comments", async () => {
  await M.Assignment.create({
    manuscript: mid,
    reviewer: reviewer2User._id,
    editor: editorUser._id,
    round: 2,
    status: "accepted",
    due: new Date("2028-02-01"),
  });
  const r = await reviewer2.get(`/api/manuscripts/${mid}`).expect(200);
  assert.equal(r.body.reviews.length, 0);
  assert.ok(!JSON.stringify(r.body).includes("SECRET EDITOR ONLY"));
  const e = await editor.get(`/api/manuscripts/${mid}`).expect(200);
  assert.ok(JSON.stringify(e.body).includes("SECRET EDITOR ONLY"));
});
test("screening requires consent, anchors corrections, preserves originals, and exports valid documents", async () => {
  await author
    .post("/api/ai/screening")
    .send({ manuscript: mid, consent: false })
    .expect(400);
  const s = await author
    .post("/api/ai/screening")
    .send({ manuscript: mid, consent: true })
    .expect(201);
  report = s.body;
  assert.equal(report.issues.length, 1);
  await outsider.get(`/api/ai/screening/${report._id}`).expect(404);
  await author
    .patch(`/api/ai/screening/${report._id}/issues/${report.issues[0]._id}`)
    .send({ decision: "accepted" })
    .expect(200);
  const doc = await author
    .get(`/api/ai/screening/${report._id}/export`)
    .buffer(true)
    .parse(binary)
    .expect(200);
  assert.match(doc.headers["content-type"], /wordprocessingml/);
  assert.equal(doc.body.subarray(0, 2).toString(), "PK");
  const pdf = await author
    .get(`/api/ai/screening/${report._id}/export?format=pdf`)
    .buffer(true)
    .parse(binary)
    .expect(200);
  assert.equal(pdf.body.subarray(0, 5).toString(), "%PDF-");
  const v = await M.Version.findById(report.version);
  assert.ok(v.text.includes("This study have"));
  await author
    .patch(`/api/ai/screening/${report._id}/issues/${report.issues[0]._id}`)
    .send({ decision: "pending" })
    .expect(200);
});
test("corrections never cascade into new matches and reject overlapping edits", () => {
  assert.equal(
    correctedText("red blue", [
      { original: "red", replacement: "blue", decision: "accepted" },
      { original: "blue", replacement: "green", decision: "accepted" },
    ]),
    "blue green",
  );
  assert.throws(
    () =>
      correctedText("abcdef", [
        { original: "abc", replacement: "x", decision: "accepted" },
        { original: "bc", replacement: "y", decision: "accepted" },
      ]),
    /overlap/,
  );
});
test("Gemini missing configuration and provider failures remain explicit; transient failures retry", async () => {
  await assert.rejects(
    () => generate({ messages: [], owner: authorUser._id }),
    (e) => e.code === "AI_NOT_CONFIGURED",
  );
  let calls = 0;
  const client = {
    models: {
      generateContent: async () => {
        calls++;
        if (calls === 1) throw { status: 503 };
        return {
          text: "A provider response",
          usageMetadata: { totalTokenCount: 10 },
        };
      },
    },
  };
  assert.equal(
    await generate({
      owner: authorUser._id,
      messages: [{ role: "user", text: "Hello" }],
      client,
    }),
    "A provider response",
  );
  assert.equal(calls, 2);
  await assert.rejects(
    () =>
      generate({
        owner: authorUser._id,
        messages: [],
        client: {
          models: {
            generateContent: async () => {
              throw { status: 403 };
            },
          },
        },
      }),
    (e) => e.code === "AI_CREDENTIALS",
  );
});
test("projects, tasks, milestones, team feedback and ownership persist", async () => {
  const p = await author
    .post("/api/projects")
    .send({
      title: "A persistent research project",
      domain: "Computer Science",
    })
    .expect(201);
  project = p.body._id;
  await outsider.get(`/api/projects/${project}`).expect(403);
  const t = await author
    .post(`/api/projects/${project}/tasks`)
    .send({
      title: "Review the literature",
      milestone: true,
      due: "2028-01-01",
    })
    .expect(201);
  await outsider
    .patch(`/api/tasks/${t.body._id}`)
    .send({ status: "done" })
    .expect(403);
  await author
    .patch(`/api/tasks/${t.body._id}`)
    .send({ status: "done" })
    .expect(200);
  await author
    .post(`/api/projects/${project}/members`)
    .send({ email: "reviewer@example.test" })
    .expect(200);
  await reviewer.get(`/api/projects/${project}`).expect(200);
  await reviewer
    .post(`/api/projects/${project}/feedback`)
    .send({ text: "Please document the evidence selection criteria." })
    .expect(200);
  const r = await author.get(`/api/projects/${project}`).expect(200);
  assert.equal(r.body.tasks[0].status, "done");
  assert.equal(r.body.project.feedback.length, 1);
  await reviewer.delete(`/api/projects/${project}`).expect(403);
});
test("library notes and writing studio persist and export; foreign records are inaccessible", async () => {
  const p = await author
    .post("/api/papers")
    .send({
      title: "Verified source entry",
      doi: "10.1234/example",
      authors: "Example Author",
      year: 2026,
    })
    .expect(201);
  await author
    .patch(`/api/papers/${p.body._id}`)
    .send({ notes: "Evidence notes", limitations: "Small sample" })
    .expect(200);
  await outsider
    .patch(`/api/papers/${p.body._id}`)
    .send({ notes: "unauthorized" })
    .expect(404);
  const bib = await author
    .get(`/api/papers/${p.body._id}/citation`)
    .buffer(true)
    .parse(binary)
    .expect(200);
  assert.ok(bib.body.toString().includes("10.1234/example"));
  const d = await author
    .post("/api/documents")
    .send({
      title: "Proposal",
      type: "proposal",
      content: "Research objectives",
    })
    .expect(201);
  await author
    .patch(`/api/documents/${d.body._id}`)
    .send({ content: "Updated objectives" })
    .expect(200);
  await outsider.get(`/api/documents/${d.body._id}`).expect(404);
  await author.get(`/api/documents/${d.body._id}/export`).expect(200);
});
test("course quiz evaluation is server-side and progress remains persistent", async () => {
  const c = await M.Course.create({
    title: "Research integrity",
    lessons: [
      {
        title: "Evidence",
        content: "Verify your evidence.",
        quiz: {
          question: "What should be checked?",
          options: ["Sources", "Nothing"],
          answer: 0,
        },
      },
    ],
  });
  let result = await request(app).get("/api/courses").expect(200);
  assert.equal(result.body[0].lessons[0].quiz.answer, undefined);
  await author.post(`/api/courses/${c._id}/enroll`).expect(200);
  await author
    .post(`/api/courses/${c._id}/lessons/0/complete`)
    .send({ answer: 1 })
    .expect(200);
  assert.equal(
    (await M.Enrollment.findOne({ owner: authorUser._id })).completed.length,
    0,
  );
  await author
    .post(`/api/courses/${c._id}/lessons/0/complete`)
    .send({ answer: 0 })
    .expect(200);
  assert.deepEqual(
    (
      await M.Enrollment.findOne({ owner: authorUser._id })
    ).completed.toObject(),
    [0],
  );
});
test("conference bookmarks, application tracking and idempotent deadline notifications", async () => {
  const now = new Date();
  const c = await M.Conference.create({
    title: "Test conference",
    deadline: new Date(now.getTime() + 12 * 3600000),
    date: new Date(now.getTime() + 86400000),
  });
  const b = await author
    .post("/api/bookmarks")
    .send({ conference: String(c._id) })
    .expect(200);
  await author
    .post("/api/bookmarks")
    .send({ conference: String(c._id) })
    .expect(200);
  assert.equal(await M.Bookmark.countDocuments({ owner: authorUser._id }), 1);
  await author
    .patch(`/api/bookmarks/${b.body._id}`)
    .send({ status: "submitted", budget: 200 })
    .expect(200);
  await outsider
    .patch(`/api/bookmarks/${b.body._id}`)
    .send({ status: "accepted", conflictDeclared:false })
    .expect(404);
  await createReminders(now);
  await createReminders(now);
  assert.equal(
    await M.Notification.countDocuments({
      title: "Conference deadline tomorrow",
      user: authorUser._id,
    }),
    1,
  );
  const o = await M.Opportunity.create({ title: "Demo opportunity" });
  const a = await author
    .post("/api/applications")
    .send({ opportunity: String(o._id) })
    .expect(200);
  await author
    .patch(`/api/applications/${a.body._id}`)
    .send({ status: "preparing" })
    .expect(200);
});
test("notification ownership, read-all, opt-out and email atomic claim/retries", async () => {
  await M.Notification.updateMany({}, { $set: { "email.state": "skipped" } });
  const n = await notify(
    authorUser,
    "Email test",
    "A test message.",
    "/dashboard",
    "system",
    "test-mail",
  );
  await notify(
    authorUser,
    "Email test",
    "A test message.",
    "/dashboard",
    "system",
    "test-mail",
  );
  assert.equal(
    await M.Notification.countDocuments({ eventKey: "test-mail" }),
    1,
  );
  await outsider
    .patch(`/api/notifications/${n._id}`)
    .send({ read: true })
    .expect(404);
  await author.post("/api/notifications/read-all").expect(200);
  assert.equal((await M.Notification.findById(n._id)).read, true);
  let sends = 0;
  const transport = {
    sendMail: async () => {
      sends++;
      await new Promise((r) => setTimeout(r, 20));
      return { accepted: [authorUser.email] };
    },
  };
  await Promise.all([deliverBatch({ transport }), deliverBatch({ transport })]);
  assert.equal(sends, 1);
  assert.equal((await M.Notification.findById(n._id)).email.state, "sent");
  const failed = await notify(authorUser, "Retry test", "Message");
  const bad = {
    sendMail: async () => {
      throw { code: "ETIMEDOUT" };
    },
  };
  await deliverBatch({ transport: bad, limit: 1 });
  let job = await M.Notification.findById(failed._id);
  assert.equal(job.email.state, "pending");
  assert.equal(job.email.attempts, 1);
  await deliverBatch({ transport, now: new Date(Date.now() + 120000) });
  assert.equal((await M.Notification.findById(failed._id)).email.state, "sent");
  await M.User.updateOne(
    { _id: authorUser._id },
    { $set: { emailNotifications: false } },
  );
  const skipped = await notify(authorUser, "Opt out test", "Message");
  await deliverBatch({ transport });
  assert.equal(
    (await M.Notification.findById(skipped._id)).email.state,
    "skipped",
  );
});
test("invalid files are rejected before storage", async () => {
  await assert.rejects(
    () =>
      extract({ originalname: "fake.pdf", buffer: Buffer.from("not a pdf") }),
    /Invalid PDF/,
  );
  await assert.rejects(
    () =>
      extract({ originalname: "fake.docx", buffer: Buffer.from("not a docx") }),
    /Invalid DOCX/,
  );
  await assert.rejects(
    () => extract({ originalname: "empty.txt", buffer: Buffer.from("") }),
    /readable text/,
  );
});
test("email attempts exhaust at five and stale worker leases are recovered", async () => {
  await M.Notification.updateMany(
    { "email.state": { $in: ["pending", "processing"] } },
    { $set: { "email.state": "skipped" } },
  );
  const n = await notify(
    editorUser,
    "Exhausted delivery test",
    "Retry five times.",
  );
  const base = Date.now();
  const transport = {
    sendMail: async () => {
      throw { code: "EAUTH" };
    },
  };
  for (let i = 0; i < 5; i++)
    await deliverBatch({
      transport,
      limit: 1,
      now: new Date(base + (i + 1) * 86400000),
    });
  let saved = await M.Notification.findById(n._id);
  assert.equal(saved.email.state, "failed");
  assert.equal(saved.email.attempts, 5);
  const stale = await notify(
    editorUser,
    "Stale lease test",
    "Recover this job.",
  );
  await M.Notification.updateOne(
    { _id: stale._id },
    {
      $set: {
        "email.state": "processing",
        "email.leaseUntil": new Date(base - 1000),
      },
    },
  );
  await deliverBatch({
    transport: { sendMail: async () => ({ accepted: [editorUser.email] }) },
  });
  saved = await M.Notification.findById(stale._id);
  assert.equal(saved.email.state, "sent");
});
test('single-role operational boundaries and audited administrator access',async()=>{
 for(const actor of [reviewer2,publisher,admin]){
   await actor.post('/api/manuscripts').send({}).expect(403);
   await actor.get('/api/documents').expect(403);
   await actor.get('/api/ai/assistants').expect(403);
 }
 await publisher.get('/api/reviewers').expect(403);
 await author.get('/api/editorial/assignments').expect(403);
 await admin.get(`/api/manuscripts/${mid}`).expect(403);
 await admin.post(`/api/manuscripts/${mid}/status`).send({status:'accepted',note:'Unauthorized editorial intervention.'}).expect(403);
 await admin.post(`/api/admin/manuscripts/${mid}/access`).send({reason:'Inspect the operational state for support investigation.'}).expect(200);
 assert.ok(await M.Audit.exists({action:'admin.sensitive_read',resourceId:mid}));
 const p=(await publisher.get(`/api/manuscripts/${mid}`).expect(200)).body;
 assert.deepEqual(p.reviews,[]);assert.deepEqual(p.assignments,[]);
 assert.equal(JSON.stringify(p).includes('SECRET EDITOR ONLY'),false);
 await author.get('/api/dashboard?workspace=admin').expect(403);
});

test('editor and admin operational lists preserve scope and exclude secrets',async()=>{
 await author.get('/api/operations/editor').expect(403);
 const e=await editor.get('/api/operations/editor').expect(200);
 assert.ok(e.body.manuscripts.some(m=>m._id===mid));
 assert.ok(!JSON.stringify(e.body).includes('SECRET EDITOR ONLY'));
 await reviewer2.get('/api/operations/users').expect(403);
 const users=await admin.get('/api/operations/users').expect(200);
 assert.ok(users.body.every(u=>!u.passwordHash&&!u.tokenVersion));
 assert.ok(users.body.find(u=>u.id===String(editorUser._id)).journals.length>0);
 const services=await admin.get('/api/operations/services').expect(200);
 assert.equal(services.body.find(s=>s.name==='Database').status,'verified');
 assert.equal(services.body.find(s=>s.name==='Gemini').status,'not verified');
});

test('publisher lists use journal scope and exclude confidential review material',async()=>{
 await author.get('/api/operations/publisher').expect(403);
 const rows=(await publisher.get('/api/operations/publisher').expect(200)).body;
 assert.equal(rows.records.find(m=>m._id===mid).stage,'published');
 assert.ok(!JSON.stringify(rows).includes('SECRET EDITOR ONLY'));
 const other=await M.User.create({name:'Other publisher',email:'other-publisher@example.test',roles:['publisher'],passwordHash:await bcrypt.hash('12345',4),active:true});
 const cookie=`publixia_session=${jwt.sign({sub:String(other._id),version:other.tokenVersion},env.jwtSecret,{expiresIn:'5m'})}`;
 const noAccess=await request(app).get('/api/operations/publisher').set('Cookie',cookie).expect(200);
 assert.equal(noAccess.body.records.length,0);
 await request(app).get(`/api/articles/${mid}/file`).expect(200);
});

test("database disconnect returns explicit service-unavailable status", async () => {
  await mongoose.disconnect();
  await request(app).get("/api/health").expect(503);
  await request(app).get("/api/journals").expect(503);
  await mongoose.connect(mongo.getUri("publixia_test"));
});
