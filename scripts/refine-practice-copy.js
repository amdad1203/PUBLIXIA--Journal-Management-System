import mongoose from "mongoose";
import { connectDB } from "../backend/config/db.js";
await connectDB();
const fields = {
  users: ["bio"],
  journals: ["description", "guidelines"],
  manuscripts: ["abstract", "declarations", "history"],
  versions: ["text"],
  papers: ["source", "notes", "methodology", "findings", "limitations"],
  projects: ["description", "objectives"],
  courses: ["description", "lessons"],
  conferences: ["description", "verification", "source"],
  opportunities: ["description", "verification", "eligibility", "funding"],
};
const rewrite = (v) =>
  typeof v === "string"
    ? v
        .replace(/\bsynthetic\b/gi, "illustrative")
        .replace(/\bdemonstration\b/gi, "practice workflow")
        .replace(/\bdemo\b/gi, "practice")
        .replace(/\bdummy\b/gi, "example")
    : Array.isArray(v)
      ? v.map(rewrite)
      : v && v.constructor === Object
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rewrite(x)]))
        : v;
try {
  for (const [name, paths] of Object.entries(fields)) {
    const c = mongoose.connection.collection(name);
    let count = 0;
    for (const d of await c
      .find({})
      .project(Object.fromEntries(paths.map((p) => [p, 1])))
      .toArray()) {
      const before = {},
        after = {};
      for (const p of paths)
        if (d[p] !== undefined) {
          const revised = rewrite(d[p]);
          if (JSON.stringify(revised) !== JSON.stringify(d[p])) {
            before[p] = d[p];
            after[p] = revised;
          }
        }
      if (Object.keys(after).length) {
        await mongoose.connection
          .collection("contentrevisionbackups")
          .insertOne({
            collection: name,
            record: d._id,
            before,
            at: new Date(),
          });
        await c.updateOne({ _id: d._id }, { $set: after });
        count++;
      }
    }
    console.log(name, count);
  }
} finally {
  await mongoose.disconnect();
}
