import { test } from "node:test";
import assert from "node:assert/strict";
import { retrieve, resolveDomain } from "../backend/services/discovery.js";
test("manuscript subject takes priority and three research profiles select distinct standards", () => {
  for (const domain of ["Computer Vision", "Remote Sensing", "Cybersecurity"])
    assert.equal(
      resolveDomain(
        { title: `Evaluation of ${domain} methods` },
        { interests: "Business and Management" },
      ),
      domain,
    );
  assert.equal(
    resolveDomain(
      { title: "An unspecified study" },
      { interests: "Cybersecurity" },
    ),
    "Cybersecurity",
  );
});
test("OpenAlex normalizes publication metadata and reconstructs abstracts", async () => {
  let requested;
  const result = await retrieve({ q: "vision", page: 2 }, async (url) => {
    requested = String(url);
    return {
      ok: true,
      json: async () => ({
        meta: { count: 21 },
        results: [
          {
            id: "https://openalex.org/W1",
            title: "A study",
            authorships: [{ author: { display_name: "A Researcher" } }],
            doi: "https://doi.org/10.1234/x",
            abstract_inverted_index: { Study: [0], results: [1] },
          },
        ],
      }),
    };
  });
  assert.match(requested, /page=2/);
  assert.equal(result.records[0].doi, "10.1234/x");
  assert.equal(result.records[0].abstract, "Study results");
  assert.equal(result.total, 21);
});
test("provider failure returns explicit service error without fabricated records", async () => {
  await assert.rejects(
    retrieve({ provider: "crossref", q: "test" }, async () => ({
      ok: false,
      status: 429,
    })),
    (e) => e.status === 503,
  );
});
