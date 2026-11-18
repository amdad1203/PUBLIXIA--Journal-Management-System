import fs from "node:fs/promises";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../backend/config/db.js";
import {
  User,
  Journal,
  Project,
  AuthToken,
  Notification,
} from "../backend/models/index.js";
import { notify, deliverBatch } from "../backend/services/notifications.js";
const team = JSON.parse(
  await fs.readFile(".local-data/team-config.json", "utf8"),
);
let saved = [];
try {
  saved = JSON.parse(
    await fs.readFile(".local-data/team-credentials.json", "utf8"),
  );
} catch {}
await connectDB();
try {
  const users = [];
  for (const entry of team) {
    let u = await User.findOne({ email: entry.email });
    if (!u) {
      const password = randomBytes(18).toString("base64url") + "!7";
      u = await User.create({
        ...entry,
        passwordHash: await bcrypt.hash(password, 12),
        demo: false,
        emailNotifications: true,
        emailVerified: false,
        interests: "Cybersecurity, research methodology and reproducibility",
      });
      saved.push({ ...entry, password });
      await fs.writeFile(
        ".local-data/team-credentials.json",
        JSON.stringify(saved, null, 2),
      );
    }
    users.push(u);
  }
  const journal = await Journal.findOneAndUpdate(
    { slug: "publixia-team-research" },
    {
      $set: {
        name: "Publixia Research Methods",
        subject: "Research methodology and computing",
        description:
          "The team editorial workspace for preparing, reviewing and publishing research manuscripts.",
        guidelines:
          "Provide a clear research question, related work, reproducible methods, evidence, limitations, references and ethical declarations. Upload a manuscript before submission.",
        editors: users
          .filter(
            (u) => u.roles.includes("editor") || u.roles.includes("publisher"),
          )
          .map((u) => u._id),
        synthetic: false,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  await Project.findOneAndUpdate(
    { owner: users[0]._id, title: "Research publication team" },
    {
      $setOnInsert: {
        description:
          "Coordinate manuscript preparation, peer review, revisions and publication.",
        domain: "Cybersecurity",
        objectives:
          "Prepare a reproducible study and complete the editorial workflow.",
        members: users.slice(1).map((u) => u._id),
        status: "active",
      },
    },
    { upsert: true },
  );
  const instructions =
    "\n\nUse http://localhost:4000 on the presenter computer. This address is local; it is not a hosted public website. Click the verification link from the setup email on that computer before demonstrating workflow email.\n\nJournal: Publixia Research Methods. Author uploads and submits; editor opens screening and invites reviewer; reviewer accepts; editor opens under review; reviewer submits; editor decides; publisher advances production and publishes with an issue. Admin manages authority criteria and email delivery.\n";
  await fs.writeFile(
    "PRIVATE_TEAM_CREDENTIALS.md",
    "# Publixia team login credentials\n\nThese are Publixia passwords, not Gmail passwords. Keep this file private.\n\n| Email | Roles | Password |\n| --- | --- | --- |\n" +
      saved
        .map((u) => `| ${u.email} | ${u.roles.join(", ")} | ${u.password} |`)
        .join("\n") +
      instructions,
  );
  const jobs = [];
  for (const u of users) {
    const eventKey = `team-setup-2026-11:${u._id}`;
    let job = await Notification.findOne({ eventKey });
    if (!job) {
      const token = randomBytes(32).toString("hex");
      await AuthToken.create({
        user: u._id,
        kind: "verify",
        hash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 86400000),
      });
      job = await notify(
        u,
        "Your Publixia team account is ready",
        `Your Publixia account is ${u.email}. Roles: ${u.roles.join(", ")}. Your project presenter has your initial login password. Verify your address using the link below to enable publishing and research notifications. The workspace currently runs on the presenter computer; open the link there. No Gmail password is needed.`,
        `/verify-email?token=${token}`,
        "account",
        eventKey,
      );
    }
    jobs.push(job._id);
  }
  await deliverBatch({ jobIds: jobs, limit: 5 });
  console.log(
    JSON.stringify(
      await Notification.find({ _id: { $in: jobs } })
        .populate("user", "email")
        .select("user email.state email.lastError"),
      null,
      2,
    ),
  );
  console.log("Private credentials saved. Journal:", journal.name);
} finally {
  await mongoose.disconnect();
}
