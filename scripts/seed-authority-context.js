import { connectDB } from "../backend/config/db.js";
import mongoose from "mongoose";
import { Criteria } from "../backend/routes/intelligence.js";
import { ResearchRecord } from "../backend/services/discovery.js";
await connectDB();
try {
  const criteria = {
    general:
      "Assess research question clarity, evidence, study design, reproducibility, limitations, ethics and reference accuracy.",
    "Computer Vision":
      "Assess dataset provenance, train validation test separation, leakage, architecture, baseline comparisons, segmentation or detection metrics, ablations and reproducibility.",
    "Remote Sensing":
      "Assess sensor information, spatial and spectral resolution, study area, preprocessing, ground truth, spatial leakage, validation and uncertainty.",
    Cybersecurity:
      "Assess the threat model, attack assumptions, dataset provenance, temporal leakage, false positive rates, adversarial evaluation and reproducibility.",
  };
  for (const [domain, instructions] of Object.entries(criteria))
    if (!(await Criteria.exists({ domain, published: true })))
      await Criteria.create({
        name: `${domain} evaluation standard`,
        domain,
        instructions:
          instructions +
          " Give passage-specific, actionable feedback. Do not invent evidence or change scientific claims. State missing evidence explicitly.",
        depth: "detailed",
        weights: { methodology: 35, evidence: 35, clarity: 15, ethics: 15 },
        published: true,
      });
  const people = [
    ["Hasanuzzaman, Mirza", "Sher-e-Bangla Agricultural University"],
    ["Murshed, Muntasir", "North South University"],
    ["Islam, Md Torequl", "Gopalganj Science and Technology University"],
    ["Alam, Muhammad Ashraful", "North South University"],
    ["Hossain, M. Khalid", "Bangladesh Atomic Energy Commission"],
    ["ISLAM, Abu Reza Md Towfiqul", "Begum Rokeya University"],
    ["Islam, Md Rabiul", "BRAC University"],
    ["Islam, Aminul", "Jashore University of Science and Technology"],
    ["Rasul, Mohammad Golam", "Gazipur Agricultural University"],
    [
      "Rasul, Golam",
      "International University of Business Agriculture and Technology",
    ],
  ];
  for (const [i, [title, institution]] of people.entries())
    await ResearchRecord.updateOne(
      { provider: "topscinet", externalId: `bangladesh-2026-${i + 1}` },
      {
        $set: {
          kind: "authors",
          title,
          institution,
          country: "BD",
          ranking: i + 1,
          rankingYear: 2026,
          rankingMethod:
            "Source-reported composite score excluding self-citations; ranking scope follows the linked source. Not independently recomputed.",
          url: "https://topscinet.com/rankings/bgd/",
          retrievedAt: new Date(),
        },
      },
      { upsert: true },
    );
  console.log(
    "Authority standards and 10 attributed Bangladesh ranking records saved.",
  );
} finally {
  await mongoose.disconnect();
}
