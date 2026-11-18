import fs from "node:fs/promises";
import mongoose from "mongoose";
import {authorLessons} from '../backend/seed/author-courses.js';
import { connectDB } from "../backend/config/db.js";
import { CuratedRecord, evidenceText } from "../backend/routes/author.js";
import {
  Paper,
  User,
  Opportunity,
  Conference,
  Course,
} from "../backend/models/index.js";
await connectDB();
try {
  const works = await CuratedRecord.find({ kind: "publications" }).lean();
  const users = await User.find({ active: true }).select("_id").lean();
  for (const u of users)
    await Paper.bulkWrite(
      works.map((r) => {
        const d = r.data;
        const filter = {
          owner: u._id,
          ...(d.doi ? { doi: d.doi } : { url: r.sourceUrl }),
        };
        return {
          updateOne: {
            filter,
            update: {
              $setOnInsert: {
                ...filter,
                title: d.title,
                authors: (d.authors || []).join(", "),
                year: d.year,
                url: r.sourceUrl,
                abstract: d.summary,
                source: r.checkStatus,
                methodology: evidenceText(d.methodology),
                findings: evidenceText(d.findings),
                limitations: evidenceText(d.limitations_and_review_fields),
                notes: `Source-pack annotations. Publication status: ${d.status}. Verify claims against the original source.`,
                collection: "Starter reading list",
                synthetic: false,
              },
            },
            upsert: true,
          },
        };
      }),
    );
  const opps = await CuratedRecord.find({ kind: "opportunities" });
  for (const r of opps) {
    const d = r.data;
    await Opportunity.updateOne(
      { url: r.sourceUrl },
      {
        $set: {
          title: d.title,
          type: d.type,
          description: d.summary,
          eligibility:
            "Check the official announcement for degree, subject, language and application requirements.",
          funding: d.salary || "See official employment terms",
          deadline: new Date(d.deadline + "T23:59:59Z"),
          url: r.sourceUrl,
          verification: `Official deadline checked 8 November 2026${d.id.includes("gothenburg") ? "; individual project details require vacancy-page review" : ""}`,
          synthetic: false,
        },
      },
      { upsert: true },
    );
  }
  const events = await CuratedRecord.find({ kind: "conferences" });
  for (const r of events) {
    const d = r.data;
    await Conference.updateOne(
      { url: r.sourceUrl },
      {
        $set: {
          title: d.name,
          domain: "Computing and artificial intelligence",
          city: (d.location || "Phoenix, United States").split(",")[0],
          country: (d.location || "Phoenix, United States")
            .split(",")
            .slice(1)
            .join(",")
            .trim(),
          date: new Date(d.event_start),
          ...(d.submission_deadline
            ? { deadline: new Date(d.submission_deadline) }
            : {}),
          description: d.submission_status,
          url: r.sourceUrl,
          source: r.sourceUrl,
          verification: "Official event schedule checked 8 November 2026",
          retrievedAt: new Date(),
          synthetic: false,
        },
      },
      { upsert: true },
    );
  }
  const guide = await fs.readFile(
    "frontend/src/content/author-guide.md",
    "utf8",
  );
  const chapter = guide
    .split("# 13. Research Academy")[1]
    .split("# 14. Conferences")[0];
  const courses = chapter.split(/\n## Course \d+ — /).slice(1);
  for (const [courseIndex,block] of courses.entries()) {
    const [title, ...lines] = block.split("\n");
    await Course.updateOne(
      { title: title.trim() },
      {
        $set: {
          category: "Research practice",
          title: title.trim(),
          description:
            "A practical course connected to your research plan, saved evidence and manuscript.",
          level: "Foundations",
          duration: "Self-paced",
          synthetic: false,
          lessons: [authorLessons[courseIndex]],
        },
      },
      { upsert: true },
    );
  }
  console.log(
    "Populated",
    users.length,
    "libraries with",
    works.length,
    "source records; opportunities",
    opps.length,
    "conferences",
    events.length,
    "courses",
    courses.length,
  );
} finally {
  await mongoose.disconnect();
}
