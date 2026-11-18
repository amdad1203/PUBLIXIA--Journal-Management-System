import mongoose from "mongoose";
import { connectDB } from "../backend/config/db.js";
import { Conference } from "../backend/models/index.js";
await connectDB();
let count = 0;
try {
  for (const year of [2026, 2027])
    for (const topic of ["security", "data", "python", "javascript"]) {
      const source = `https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences/${year}/${topic}.json`;
      const response = await fetch(source, {
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        console.log(year, topic, response.status);
        continue;
      }
      const records = await response.json();
      if (!Array.isArray(records)) throw new Error("Invalid conference feed");
      for (const r of records) {
        if (
          !r.name ||
          !/^https?:\/\//.test(r.url) ||
          !r.startDate ||
          new Date(r.endDate || r.startDate) < new Date()
        )
          continue;
        const deadline =
          r.cfpEndDate && Number.isFinite(Date.parse(r.cfpEndDate))
            ? new Date(r.cfpEndDate)
            : undefined;
        await Conference.updateOne(
          { url: r.url, date: new Date(r.startDate) },
          {
            $set: {
              title: r.name,
              domain: topic,
              country: r.country,
              city: r.city || "Online",
              date: new Date(r.startDate),
              ...(deadline ? { deadline } : {}),
              url: r.url,
              description: `${r.name} brings together the ${topic} community${r.city ? ` in ${r.city}` : ""}. Visit the organizer for the program, participation details and current submission requirements.`,
              source,
              verification: "CONFS.TECH community listing",
              synthetic: false,
              retrievedAt: new Date(),
            },
            ...(!deadline ? { $unset: { deadline: "" } } : {}),
          },
          { upsert: true },
        );
        count++;
      }
      console.log(year, topic, "processed");
    }
  console.log("Current source event records processed:", count);
} finally {
  await mongoose.disconnect();
}
