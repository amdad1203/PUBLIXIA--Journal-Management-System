import { Router } from "express";
import { z } from "zod";
import {
  Course,
  Enrollment,
  Conference,
  Bookmark,
  Opportunity,
  Application,
  Notification,
  Project,
  Task,
  Manuscript,
  Paper,
  Assignment,
  User,
  Journal,
  AIUsage,
  Audit,
  Document,
} from "../models/index.js";
import { auth, allow, hasRole } from "../middleware/auth.js";
import {
  text,
  id,
  parse,
  fail,
  page,
  search,
  safeUser,
  same,
} from "../utils/http.js";
import { notify, mailConfigured } from "../services/notifications.js";
import { env } from "../config/env.js";
import { manuscriptScope, selectedRole } from '../services/workspaces.js';
export const community = Router();
community.use((req, res, next) =>
  /^\/(catalog|courses|conferences|opportunities|enrollments|bookmarks|applications|notifications|dashboard|admin)(\/|$)/.test(
    req.path,
  )
    ? next()
    : next("router"),
);
community.get("/catalog/stats", async (req, res) => {
  const [journals, articles, courses, conferences] = await Promise.all([
    Journal.countDocuments({ synthetic: { $ne: true } }),
    Manuscript.countDocuments({
      status: "published",
      synthetic: { $ne: true },
    }),
    Course.countDocuments(),
    Conference.countDocuments({
      date: { $gte: new Date() },
      synthetic: { $ne: true },
    }),
  ]);
  res.json({ journals, articles, courses, conferences });
});
community.get("/courses", async (req, res) =>
  res.json(
    await Course.find({ title: search(req.query.q) })
      .select("-lessons.quiz.answer")
      .limit(100),
  ),
);
community.get("/conferences", async (req, res) => {
  const q = { title: search(req.query.q), synthetic: { $ne: true } };
  if (req.query.country) q.country = String(req.query.country);
  if (req.query.upcoming === "true") q.deadline = { $gte: new Date() };
  res.json(
    await Conference.find(q)
      .sort({ date: 1 })
      .skip(page(req).skip)
      .limit(page(req).limit),
  );
});
community.get("/opportunities", async (req, res) =>
  res.json(
    await Opportunity.find({
      title: search(req.query.q),
      synthetic: { $ne: true },
    })
      .sort({ deadline: 1 })
      .limit(100),
  ),
);
community.use(auth);
community.use((req,res,next)=>{
  if (/^\/(enrollments|bookmarks|applications|courses)(\/|$)/.test(req.path)) return allow('researcher')(req,res,next);
  next();
});
community.get("/enrollments", async (req, res) =>
  res.json(
    await Enrollment.find({ owner: req.user._id }).populate(
      "course",
      "title lessons.title",
    ),
  ),
);
community.post("/courses/:id/enroll", async (req, res) => {
  id.parse(req.params.id);
  if (!(await Course.exists({ _id: req.params.id })))
    fail(404, "Course not found.");
  const e = await Enrollment.findOneAndUpdate(
    { owner: req.user._id, course: req.params.id },
    { $setOnInsert: { completed: [], attempts: [] } },
    { returnDocument: "after", upsert: true },
  );
  res.json(e);
});
community.post("/courses/:id/lessons/:lesson/complete", async (req, res) => {
  id.parse(req.params.id);
  const lesson = z.coerce.number().int().min(0).parse(req.params.lesson);
  const b = parse(z.object({ answer: z.number().int().min(0).max(10) }), req);
  const c = await Course.findById(req.params.id);
  if (!c?.lessons[lesson]) fail(404, "Lesson not found.");
  const e = await Enrollment.findOne({ owner: req.user._id, course: c._id });
  if (!e) fail(400, "Enroll in the course first.");
  if (e.attempts.length >= 1000) fail(400, "Quiz attempt limit reached.");
  const correct = b.answer === c.lessons[lesson].quiz.answer;
  e.attempts.push({ lesson, answer: b.answer, correct });
  if (correct && !e.completed.includes(lesson)) e.completed.push(lesson);
  await e.save();
  if (correct)
    await notify(
      req.user,
      "Learning progress updated",
      `You completed “${c.lessons[lesson].title}”.`,
      `/academy/${c._id}`,
      "learning",
      `lesson:${req.user._id}:${c._id}:${lesson}`,
    );
  res.json({ enrollment: e, correct });
});
community.get("/bookmarks", async (req, res) =>
  res.json(await Bookmark.find({ owner: req.user._id }).populate("conference")),
);
community.post("/bookmarks", async (req, res) => {
  const b = parse(z.object({ conference: id }), req);
  if (!(await Conference.exists({ _id: b.conference })))
    fail(404, "Conference not found.");
  res.json(
    await Bookmark.findOneAndUpdate(
      { ...b, owner: req.user._id },
      { $setOnInsert: { status: "saved", budget: 0 } },
      { returnDocument: "after", upsert: true },
    ),
  );
});
community.patch("/bookmarks/:id", async (req, res) => {
  id.parse(req.params.id);
  const b = parse(
    z.object({
      status: z
        .enum(["saved", "preparing", "submitted", "accepted", "rejected"])
        .optional(),
      budget: z.number().min(0).max(10000000).optional(),
    }),
    req,
  );
  const mark = await Bookmark.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: b },
    { returnDocument: "after" },
  );
  if (!mark) fail(404, "Bookmark not found.");
  res.json(mark);
});
community.delete("/bookmarks/:id", async (req, res) => {
  id.parse(req.params.id);
  await Bookmark.deleteOne({ _id: req.params.id, owner: req.user._id });
  res.json({ ok: true });
});
community.get("/applications", async (req, res) =>
  res.json(
    await Application.find({ owner: req.user._id }).populate("opportunity"),
  ),
);
community.post("/applications", async (req, res) => {
  const b = parse(z.object({ opportunity: id }), req);
  if (!(await Opportunity.exists({ _id: b.opportunity })))
    fail(404, "Opportunity not found.");
  res.json(
    await Application.findOneAndUpdate(
      { ...b, owner: req.user._id },
      { $setOnInsert: { status: "saved" } },
      { returnDocument: "after", upsert: true },
    ),
  );
});
community.patch("/applications/:id", async (req, res) => {
  id.parse(req.params.id);
  const b = parse(
    z.object({
      status: z
        .enum(["saved", "preparing", "submitted", "successful", "unsuccessful"])
        .optional(),
      notes: text(5000, 0).optional(),
    }),
    req,
  );
  const a = await Application.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: b },
    { returnDocument: "after" },
  );
  if (!a) fail(404, "Application not found.");
  res.json(a);
});
community.get("/notifications", async (req, res) => {
  const q = { user: req.user._id, archived: false };
  const [items, unread] = await Promise.all([
    Notification.find(q)
      .select("-email.leaseToken")
      .sort({ createdAt: -1 })
      .skip(page(req).skip)
      .limit(page(req).limit),
    Notification.countDocuments({ ...q, read: false }),
  ]);
  res.json({ items, unread, emailConfigured: mailConfigured() });
});
community.post("/notifications/read-all", async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id },
    { $set: { read: true } },
  );
  res.json({ ok: true });
});
community.patch("/notifications/:id", async (req, res) => {
  id.parse(req.params.id);
  const b = parse(
    z.object({
      read: z.boolean().optional(),
      archived: z.boolean().optional(),
    }),
    req,
  );
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: b },
    { returnDocument: "after" },
  );
  if (!n) fail(404, "Notification not found.");
  res.json(n);
});
community.post("/notifications/test-email", async (req, res) => {
  if (req.user.demo)
    fail(
      400,
      "Demo accounts cannot send mail. Register your own account to test.",
    );
  if (!req.user.emailVerified)
    fail(400, "Verify your email address before testing delivery.");
  if (!mailConfigured()) fail(503, "Email sender is not configured.");
  if (
    await Notification.exists({
      user: req.user._id,
      category: "email-test",
      createdAt: { $gt: new Date(Date.now() - 60000) },
    })
  )
    fail(429, "Wait one minute before another test.");
  await notify(
    req.user,
    "Your Publixia email is connected",
    "This confirms the notification delivery path for your account.",
    "/notifications",
    "email-test",
  );
  res.json({
    message:
      "Test notification queued. Delivery status is visible in Notifications.",
  });
});
community.get("/dashboard", async (req, res) => {
  const role = selectedRole(req);
  const projects = await Project.find({
    ...(['researcher'].includes(role)?{$or: [{ owner: req.user._id }, { members: req.user._id }]}:{_id:{$in:[]}}),
  })
    .sort({ updatedAt: -1 })
    .lean();
  const tasks = await Task.find({
    project: { $in: projects.map((p) => p._id) },
  }).sort({ due: 1 });
  const scope = await manuscriptScope(req.user, [role]);
  const [manuscripts, savedPapers, notifications, enrollments, assignments] =
    await Promise.all([
      Manuscript.find(scope)
        .select("code title status editorialStatus productionStatus publicationStatus updatedAt journal")
        .populate("journal", "name")
        .sort({ updatedAt: -1 }),
      role==='researcher' ? Paper.countDocuments({ owner: req.user._id }) : 0,
      Notification.find({ user: req.user._id, archived: false })
        .sort({ createdAt: -1 })
        .limit(5),
      Enrollment.find({ owner: req.user._id, ...(role!=='researcher'?{_id:{$in:[]}}:{}) }).populate(
        "course",
        "title lessons.title",
      ),
      Assignment.find({ reviewer: req.user._id, ...(role!=='reviewer'?{_id:{$in:[]}}:{}) }).populate(
        "manuscript",
        "title code",
      ),
    ]);
  res.json({
    role,
    projects: projects.map((p) => ({
      ...p,
      taskCount: tasks.filter((t) => same(t.project, p._id)).length,
      completedTasks: tasks.filter(
        (t) => same(t.project, p._id) && t.status === "done",
      ).length,
    })),
    tasks,
    manuscripts,
    savedPapers,
    notifications,
    enrollments,
    assignments,
    stats: {
      projects: projects.length,
      openTasks: tasks.filter((t) => t.status !== "done").length,
      manuscripts: manuscripts.length,
      papers: savedPapers,
    },
    statusCounts: manuscripts.reduce(
      (out, m) => ((out[m.status] = (out[m.status] || 0) + 1), out),
      {},
    ),
  });
});
community.get("/admin/overview", allow("admin"), async (req, res) => {
  const [users, journals, manuscripts, projects, aiUsage, outbox, audit] =
    await Promise.all([
      User.countDocuments(),
      Journal.countDocuments(),
      Manuscript.countDocuments(),
      Project.countDocuments(),
      AIUsage.aggregate([
        {
          $group: {
            _id: "$success",
            requests: { $sum: 1 },
            tokens: { $sum: "$tokens" },
          },
        },
      ]),
      Notification.aggregate([
        { $group: { _id: "$email.state", count: { $sum: 1 } } },
      ]),
      Audit.find().populate("actor", "name").sort({ createdAt: -1 }).limit(30),
    ]);
  res.json({
    counts: { users, activeJournals:await Journal.countDocuments({external:{$ne:true},active:{$ne:false}}), manuscripts, published:await Manuscript.countDocuments({status:'published'}),activeReviewAssignments:await Assignment.countDocuments({status:{$in:['invited','accepted']}}),pendingAdministrativeTasks:await User.countDocuments({emailVerified:false,active:true}) },
    usersByRole:await User.aggregate([{$unwind:'$roles'},{$group:{_id:'$roles',count:{$sum:1}}}]),
    aiUsage,
    outbox,
    audit,
    integrations: {
      gemini: !!env.geminiKey,
      model: env.geminiModel,
      email: mailConfigured(),
      database: "connected",
    },
  });
});
community.get("/admin/users", allow("admin"), async (req, res) =>
  res.json(
    (await User.find({ name: search(req.query.q) }).limit(100)).map(safeUser),
  ),
);
community.post('/admin/manuscripts/:id/access',allow('admin'),async(req,res)=>{
  id.parse(req.params.id);const b=parse(z.object({reason:text(2000,20)}),req);
  const m=await Manuscript.findById(req.params.id).select('code title author journal editorialStatus productionStatus publicationStatus status currentVersion acceptedVersion');
  if(!m)fail(404,'Manuscript not found.');
  await Audit.create({actor:req.user._id,action:'admin.sensitive_read',resource:'Manuscript',resourceId:String(m._id),details:{reason:b.reason}});
  res.json(m);
});
community.patch("/admin/users/:id", allow("admin"), async (req, res) => {
  id.parse(req.params.id);
  const b = parse(
    z.object({
      roles: z
        .array(
          z.enum([
            "researcher",


            "reviewer",
            "editor",
            "publisher",

            "admin",
          ]),
        )
        .min(1),
      active: z.boolean().optional(),
    }),
    req,
  );
  if (same(req.params.id, req.user._id))
    fail(400, "Use another administrator to change your own access.");
  const u = await User.findByIdAndUpdate(
    req.params.id,
    { $set: b, $inc: { tokenVersion: 1 } },
    { returnDocument: "after" },
  );
  if (!u) fail(404, "User not found.");
  await Audit.create({
    actor: req.user._id,
    action: "user.permissions",
    resource: "User",
    resourceId: req.params.id,
  });
  res.json(safeUser(u));
});
community.post(
  "/admin/notifications/:id/retry",
  allow("admin"),
  async (req, res) => {
    id.parse(req.params.id);
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, "email.state": "failed" },
      {
        $set: {
          "email.state": "pending",
          "email.nextAttempt": new Date(),
          "email.attempts": 0,
        },
      },
      { returnDocument: "after" },
    );
    if (!n) fail(404, "Failed delivery not found.");
    res.json({ ok: true });
  },
);
community.get("/admin/email", allow("admin"), async (req, res) =>
  res.json(
    await Notification.find({
      "email.state": { $in: ["failed", "pending", "sent"] },
    })
      .select("title user email createdAt")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100),
  ),
);
community.post("/admin/announcements", allow("admin"), async (req, res) => {
  const b = parse(z.object({ title: text(200), body: text(5000) }), req);
  const users = await User.find({ active: true });
  for (const u of users)
    await notify(u, b.title, b.body, "/notifications", "announcement");
  await Audit.create({
    actor: req.user._id,
    action: "announcement.create",
    resource: "Notification",
  });
  res.json({ recipients: users.length });
});
