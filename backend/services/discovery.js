import mongoose from "mongoose";
import { HttpError } from "../utils/http.js";
const { Schema } = mongoose;
export function resolveDomain(manuscript, context) {
  const groups = [
    [
      manuscript.title,
      manuscript.abstract,
      ...(Array.isArray(manuscript.keywords)
        ? manuscript.keywords
        : [manuscript.keywords || ""]),
    ].join(" "),
    context.interests || "",
    ...(context.projects || []).map((p) => p.domain || ""),
  ];
  for (const text of groups) {
    const match = [...domains]
      .sort((a, b) => b.length - a.length)
      .find((d) => text.toLowerCase().includes(d.toLowerCase()));
    if (match) return match;
  }
  return "general";
}
export const ResearchRecord = mongoose.model(
  "ResearchRecord",
  new Schema(
    {
      provider: String,
      externalId: String,
      kind: String,
      title: String,
      authors: String,
      year: Number,
      doi: String,
      url: String,
      abstract: String,
      institution: String,
      citations: Number,
      topics: [String],
      country: String,
      openAccess: Boolean,
      retrievedAt: Date,
      ranking: Number,
      rankingYear: Number,
      rankingMethod: String,
    },
    { timestamps: true },
  ).index({ provider: 1, externalId: 1 }, { unique: true }),
);
export const ImportRun = mongoose.model(
  "ImportRun",
  new Schema(
    {
      provider: String,
      query: String,
      kind: String,
      count: Number,
      status: String,
      error: String,
    },
    { timestamps: true },
  ),
);
export const domains = [
  "Computer Science",
  "Artificial Intelligence",
  "Computer Vision",
  "Cybersecurity",
  "Software Engineering",
  "Remote Sensing",
  "Signal Processing",
  "Robotics",
  "Environmental Science",
  "Biomedical Engineering",
  "Natural Sciences",
  "Social Sciences",
  "Business and Management",
];
export async function retrieve(
  { provider = "openalex", kind = "works", q = "", page = 1, country = "" },
  request = fetch,
) {
  let url;
  if (provider === "openalex") {
    url = new URL(`https://api.openalex.org/${kind}`);
    url.search = new URLSearchParams({
      per_page: "20",
      page: String(page),
      ...(q ? { search: q } : {}),
      ...(country && kind === "authors"
        ? { filter: `last_known_institutions.country_code:${country}` }
        : {}),
    });
    if (process.env.OPENALEX_API_KEY)
      url.searchParams.set("api_key", process.env.OPENALEX_API_KEY);
  } else if (provider === "crossref")
    url = `https://api.crossref.org/works?${new URLSearchParams({ query: q, rows: "20", offset: String((page - 1) * 20) })}`;
  else if (provider === "europepmc")
    url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${new URLSearchParams({ query: q || "research", format: "json", pageSize: "20", page: String(page), resultType: "core" })}`;
  else if (provider === "datacite")
    url = `https://api.datacite.org/dois?${new URLSearchParams({ query: q, "page[size]": "20", "page[number]": String(page) })}`;
  else throw new HttpError(400, "Unsupported provider.");
  let data;
  try {
    const r = await request(url, {
      signal: AbortSignal.timeout(20000),
      headers: { Accept: "application/json" },
    });
    if (!r.ok) throw new Error(String(r.status));
    data = await r.json();
  } catch {
    throw new HttpError(
      503,
      `${provider} could not complete this request. Try again later or choose another source.`,
    );
  }
  let records, total;
  if (provider === "openalex") {
    if (!Array.isArray(data.results))
      throw new HttpError(502, "Invalid OpenAlex response.");
    total = data.meta?.count || 0;
    records = data.results.map((r) => ({
      externalId: r.id,
      title: r.display_name || r.title,
      url: r.id,
      authors: (r.authorships || [])
        .map((a) => a.author.display_name)
        .join(", "),
      year: r.publication_year,
      doi: r.doi?.replace("https://doi.org/", ""),
      citations: r.cited_by_count,
      institution: (r.last_known_institutions || [])
        .map((i) => i.display_name)
        .join("; "),
      country:
        r.country_code ||
        r.last_known_institutions?.find((i) => i.country_code === country)
          ?.country_code ||
        r.last_known_institutions?.[0]?.country_code,
      topics: (r.topics || []).map((t) => t.display_name),
      openAccess: r.open_access?.is_oa,
      abstract: r.abstract_inverted_index
        ? Object.entries(r.abstract_inverted_index)
            .flatMap(([word, positions]) => positions.map((p) => [p, word]))
            .sort((a, b) => a[0] - b[0])
            .map((v) => v[1])
            .join(" ")
        : "",
    }));
  } else if (provider === "crossref") {
    total = data.message?.["total-results"] || 0;
    records = (data.message?.items || []).map((r) => ({
      externalId: r.DOI,
      title: r.title?.[0] || "Untitled",
      doi: r.DOI,
      url: r.URL,
      authors: (r.author || [])
        .map((a) => [a.given, a.family].filter(Boolean).join(" "))
        .join(", "),
      year: r.published?.["date-parts"]?.[0]?.[0],
      citations: r["is-referenced-by-count"],
      institution: r.publisher,
    }));
  } else if (provider === "europepmc") {
    total = data.hitCount || 0;
    records = (data.resultList?.result || []).map((r) => ({
      externalId: `${r.source}:${r.id}`,
      title: r.title,
      authors: r.authorString,
      year: Number(r.pubYear),
      doi: r.doi,
      url: `https://europepmc.org/article/${encodeURIComponent(r.source)}/${encodeURIComponent(r.id)}`,
      abstract: r.abstractText?.replace(/<[^>]*>/g, ""),
      openAccess: r.isOpenAccess === "Y",
      citations: Number(r.citedByCount),
    }));
  } else {
    total = data.meta?.total || 0;
    records = (data.data || []).map(({ id, attributes: r }) => ({
      externalId: id,
      title: r.titles?.[0]?.title || id,
      doi: r.doi,
      url: `https://doi.org/${r.doi}`,
      authors: (r.creators || []).map((c) => c.name).join(", "),
      year: r.publicationYear,
      abstract: r.descriptions?.[0]?.description,
      institution: r.publisher,
    }));
  }
  return {
    records: records.map((r) => ({
      ...r,
      provider,
      kind,
      retrievedAt: new Date(),
    })),
    total,
    page,
    provider,
  };
}
export async function synchronize(params) {
  try {
    const result = await retrieve(params);
    if (result.records.length)
      await ResearchRecord.bulkWrite(
        result.records.map((r) => ({
          updateOne: {
            filter: { provider: r.provider, externalId: r.externalId },
            update: { $set: r },
            upsert: true,
          },
        })),
      );
    await ImportRun.create({
      ...params,
      query: params.q,
      count: result.records.length,
      status: "success",
    });
    return result;
  } catch (e) {
    await ImportRun.create({
      ...params,
      query: params.q,
      count: 0,
      status: "failed",
      error: e.message,
    });
    throw e;
  }
}
