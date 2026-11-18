import { connectDB } from "../backend/config/db.js";
import mongoose from "mongoose";
import {
  domains,
  synchronize,
  ResearchRecord,
} from "../backend/services/discovery.js";
await connectDB();
try {
  for (const q of [...domains, "SecureBERT", "cyber threat intelligence"]) {
    try {
      const r = await synchronize({
        provider: "openalex",
        kind: "works",
        q,
        page: 1,
      });
      console.log(q, r.records.length);
    } catch (e) {
      console.log(q, e.message);
    }
  }
  for (const kind of ["authors", "institutions", "sources"]) {
    try {
      const r = await synchronize({
        provider: "openalex",
        kind,
        q:
          kind === "authors"
            ? ""
            : kind === "institutions"
              ? "Bangladesh"
              : "Computer Science",
        country: kind === "authors" ? "BD" : "",
        page: 1,
      });
      console.log(kind, r.records.length);
    } catch (e) {
      console.log(kind, e.message);
    }
  }
  for (const provider of ["crossref", "europepmc", "datacite"]) {
    try {
      const r = await synchronize({
        provider,
        kind: "works",
        q: provider === "europepmc" ? "medical imaging" : "cybersecurity",
        page: 1,
      });
      console.log(provider, r.records.length);
    } catch (e) {
      console.log(provider, e.message);
    }
  }
  console.log(
    "Persisted research records:",
    await ResearchRecord.countDocuments(),
  );
} finally {
  await mongoose.disconnect();
}
