import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, dateLabel } from "../api";
import { useApp } from "../context";
import { Heading, Field, Button, Badge } from "../components";

const domains = [
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
function BangladeshRankings() {
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api("/intelligence/bangladesh")
      .then((r) => {
        if (active) setPeople(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="panel">
      <h2>Bangladesh scientist rankings</h2>
      <p>
        Source-reported 2026 rankings. These profiles are not Publixia accounts.
        Affiliations and rankings are attributed to the linked source.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="intelligence-grid">
        {people.map((p) => (
          <article key={p._id}>
            <Badge>
              Rank {p.ranking} · {p.rankingYear}
            </Badge>
            <h3>{p.title}</h3>
            <p>{p.institution}</p>
            <p>{p.rankingMethod}</p>
            <small>Retrieved {dateLabel(p.retrievedAt)}</small>
            <p>
              <a href={p.url} target="_blank" rel="noreferrer">
                Ranking source ↗
              </a>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
const faqs = [
  [
    "What is a manuscript?",
    "A manuscript is the written report you prepare for a journal or conference. It usually contains a title, abstract, introduction, related work, methods, results, discussion, conclusion, references and declarations. A submitted manuscript has not necessarily been accepted or published.",
  ],
  [
    "What is a journal?",
    "A journal publishes scholarly articles within a subject area. Read its aims, scope, peer review policy, fees and author guidelines before submitting. Publixia journal workflows and external journal discovery are separate services.",
  ],
  [
    "What is a DOI and how does registration work?",
    "A Digital Object Identifier is a persistent identifier, commonly beginning with 10. A publisher or repository registers metadata through a DOI registration agency such as Crossref or DataCite. Resolve it at https://doi.org/ followed by the identifier. Typing a DOI-shaped string into Publixia does not register it. A DOI identifies an object; it does not certify research quality.",
  ],
  [
    "Why publish research?",
    "Publication shares methods and findings so other people can inspect, reproduce, question and build on the work. It creates a durable scholarly record. Choose a suitable venue and report limitations honestly; publication alone does not prove a result is correct.",
  ],
  [
    "How does peer review work?",
    "An editor screens a submission and invites reviewers with relevant expertise. Reviewers examine the methods, evidence and reporting, and recommend a decision. The editor decides whether to reject, request revisions or accept. Authors respond point by point and upload revised versions.",
  ],
  [
    "What is open access?",
    "Open access makes research available to read without a subscription. Reuse rights depend on the stated license. Free-to-read does not automatically permit redistribution of the full text. Follow the original source link and license.",
  ],
  [
    "What is a literature review?",
    "A literature review compares existing research to explain what is known, where findings disagree, which methods have been used and what remains uncertain. Record your search terms and inclusion criteria; compare evidence rather than listing article summaries.",
  ],
  [
    "How do I identify a research gap?",
    "Start with a specific problem. Compare recent studies, methods, populations and limitations. Check whether the proposed gap has already been addressed. A gap should lead to a feasible question whose answer matters, not merely a topic with few search results.",
  ],
  [
    "What is the scope of research?",
    "Scope states the boundaries of a study: the question, population, setting, data, methods, period and outcomes you will investigate. State exclusions and practical limits. Use the research areas below to find literature and refine a manageable question.",
  ],
  [
    "How do I find a PhD or RA and TA position?",
    "Search university graduate departments and official vacancy portals. Match research interests, entry requirements, funding and supervisor expertise. RA means research assistant and TA means teaching assistant; duties, eligibility and funding vary. Confirm deadlines and contact details on the institution website.",
  ],
  [
    "How do I apply for scholarships?",
    "Read the official eligibility rules, required degree, language requirements, funding coverage and deadline. Prepare transcripts, references, a research proposal or statement as requested. Record the application in your tracker; Publixia does not submit an application to the sponsor.",
  ],
  [
    "How does AI manuscript screening work?",
    "Upload your manuscript, consent to external AI processing and start a pre-check. Gemini uses manuscript metadata and the applicable authority criteria to produce feedback. Inspect each correction, accept or reject it and export the result. Human reviewers retain academic decision authority.",
  ],
  [
    "How do authorities personalize AI feedback?",
    "Administrators publish versioned evaluation criteria with a research domain, feedback depth and evaluation weights. A screening report stores the selected criteria snapshot. Later changes do not rewrite older reports. These are evaluation instructions, not a guarantee that model reasoning is correct.",
  ],
  [
    "What is a preprint?",
    "A preprint is a research manuscript shared before or outside formal journal peer review. Check the source, version and review status before treating its conclusions as established evidence.",
  ],
  [
    "How should I use AI ethically?",
    "Verify claims, calculations and references. Protect participant data, follow institutional and journal policies, and disclose AI assistance where required. You remain responsible for the submitted work.",
  ],
];
const tools = [
  ['Discovery','SciSpace','Read papers and explore source-linked research explanations.','https://scispace.com/'],
  ['Discovery','Undermind','Explore research questions through a literature search.','https://www.undermind.ai/'],
  ['Metadata','OpenAlex','Discover scholarly works, authors and institutions.','https://openalex.org/'],
  ['Metadata','Crossref','Resolve DOIs and check publisher-deposited metadata.','https://www.crossref.org/'],
  ['Metadata','DBLP','Find computer science publication records.','https://dblp.org/'],
  ['Discovery','IEEE Xplore','Search IEEE publications; access depends on the article or subscription.','https://ieeexplore.ieee.org/'],
  [
    "Writing",
    "Overleaf",
    "Collaborative LaTeX writing with journal templates.",
    "https://www.overleaf.com/",
  ],
  [
    "Writing",
    "LanguageTool",
    "Grammar and style suggestions to review in context.",
    "https://languagetool.org/",
  ],
  [
    "Writing",
    "Grammarly",
    "Writing feedback and editing support.",
    "https://www.grammarly.com/",
  ],
  [
    "References",
    "Zotero",
    "Collect sources and create bibliographies.",
    "https://www.zotero.org/",
  ],
  [
    "References",
    "Mendeley",
    "Reference library and citation management.",
    "https://www.mendeley.com/",
  ],
  [
    "Discovery",
    "ResearchRabbit",
    "Explore connections between papers and authors.",
    "https://www.researchrabbit.ai/",
  ],
  [
    "Discovery",
    "Connected Papers",
    "Explore related literature through visual graphs.",
    "https://www.connectedpapers.com/",
  ],
  [
    "Discovery",
    "Elicit",
    "Assistance with literature searches and evidence extraction.",
    "https://elicit.com/",
  ],
  [
    "Discovery",
    "Consensus",
    "Research question exploration with paper links.",
    "https://consensus.app/",
  ],
  [
    "Discovery",
    "Semantic Scholar",
    "Find papers, authors and citation connections.",
    "https://www.semanticscholar.org/",
  ],
  [
    "Identity",
    "ORCID",
    "Maintain a persistent scholarly identifier.",
    "https://orcid.org/",
  ],
  [
    "Identity",
    "Google Scholar",
    "Search literature and manage a scholarly profile.",
    "https://scholar.google.com/",
  ],
  [
    "Opportunities",
    "EURAXESS",
    "Research jobs and funding; verify each vacancy.",
    "https://euraxess.ec.europa.eu/jobs",
  ],
  [
    "Opportunities",
    "DAAD Bangladesh",
    "Official scholarship information and eligibility.",
    "https://www.daad-bangladesh.org/en/find-funding/scholarship-database/",
  ],
  [
    "Opportunities",
    "MSCA",
    "Doctoral and postdoctoral opportunities.",
    "https://marie-sklodowska-curie-actions.ec.europa.eu/jobs",
  ],
  [
    "Conferences",
    "IEEE Conferences",
    "Official conference search and organizer information.",
    "https://conferences.ieee.org/",
  ],
  [
    "Conferences",
    "ACM Conferences",
    "Computing conference information.",
    "https://www.acm.org/conferences",
  ],
  [
    "Repositories",
    "DOAJ",
    "Open access journal and article directory.",
    "https://doaj.org/",
  ],
  [
    "Repositories",
    "OpenAIRE",
    "Research outputs, projects and datasets.",
    "https://explore.openaire.eu/",
  ],
  [
    "Repositories",
    "CORE",
    "Open access research discovery.",
    "https://core.ac.uk/",
  ],
  [
    "Repositories",
    "arXiv",
    "Preprints with version histories.",
    "https://arxiv.org/",
  ],
];
export function ResearchGuide() {
  const [q, setQ] = useState("");
  return (
    <>
      <Heading
        eyebrow="START YOUR RESEARCH"
        title="Research guide and FAQ"
        description="Understand the process, define your scope and choose your next step."
      />
      <Field
        label="Search questions"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="guide-faq">
        {faqs
          .filter((x) => x.join(" ").toLowerCase().includes(q.toLowerCase()))
          .map(([t, a]) => (
            <details className="panel" key={t}>
              <summary>{t}</summary>
              <p>{a}</p>
            </details>
          ))}
      </div>
      <Heading
        title="Scope of research"
        description="Choose a discipline to search actual publication records. Define your study question, population, methods and limits before collecting data."
      />
      <div className="intelligence-grid">
        {domains.map((d) => (
          <Link
            className="panel"
            to={`/discover?q=${encodeURIComponent(d)}`}
            key={d}
          >
            <h3>{d}</h3>
            <p>Explore publications and related academic sources →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
export function ToolHub() {
  const [q, setQ] = useState("");
  return (
    <>
      <Heading
        eyebrow="ACADEMIC AI HUB"
        title="Tools for your research journey"
        description="Start with sources, organize references, then write and verify. These links open external services; check their privacy policies before uploading a manuscript."
      />
      <div className="panel">
        <h2>A practical starting path</h2>
        <p>
          1. Search publications in Research discovery. 2. Organize references
          in Zotero. 3. Draft in Studio or Overleaf. 4. Ask the AI lab for
          feedback. 5. Verify references and run a manuscript pre-check.
        </p>
        <Link to="/ai" className="btn">
          Open Publixia AI lab
        </Link>
      </div>
      <Field
        label="Find a tool or category"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="intelligence-grid">
        {tools
          .filter((t) => t.join(" ").toLowerCase().includes(q.toLowerCase()))
          .map(([cat, name, desc, url]) => (
            <article className="panel" key={name}>
              <Badge>{cat}</Badge>
              <h3>{name}</h3>
              <p>{desc}</p>
              <p><Link to={`/author-handbook?q=${encodeURIComponent(name)}`}>Usage guidance and limitations</Link></p>
              <a href={url} target="_blank" rel="noreferrer">
                Visit official website ↗
              </a>
            </article>
          ))}
      </div>
    </>
  );
}
export function Discovery() {
  const { user } = useApp();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [provider, setProvider] = useState("openalex");
  const [kind, setKind] = useState("works");
  const [country, setCountry] = useState("");
  const [saved, setSaved] = useState(!params.has("q"));
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const search = async (p = 1, query = q, stored = saved) => {
    setBusy(true);
    setError("");
    try {
      setData(
        await api(
          `/intelligence/${stored ? "records" : "search"}?${new URLSearchParams({ q: query, provider, kind, page: String(p), country })}`,
        ),
      );
      setPage(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    search(1, params.get("q") || "");
  }, []);
  async function personalize() {
    try {
      const c = await api("/intelligence/context");
      const topic =
        c.interests || c.projects[0]?.domain || c.projects[0]?.title || "";
      setQ(topic);
      await search(1, topic);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="SOURCED ACADEMIC RECORDS"
        title="Research discovery"
        description="Explore real publications, researchers, institutions and journals. Each result links to its source; citation counts reflect the provider's retrieval date."
      />
      <form
        className="panel discovery-controls"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <Field
          label="Search topic or name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Field label="Source">
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setKind("works");
            }}
          >
            {["openalex", "crossref", "europepmc", "datacite"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Record type">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {(provider === "openalex"
              ? ["works", "authors", "sources", "institutions", "topics"]
              : ["works"]
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        {kind === "authors" && (
          <Field label="Affiliation country">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">All countries</option>
              <option value="BD">Bangladesh</option>
            </select>
          </Field>
        )}
        <Field label="Search mode">
          <select
            value={saved ? "saved" : "live"}
            onChange={(e) => setSaved(e.target.value === "saved")}
          >
            <option value="saved">Imported database</option>
            <option value="live">Live provider</option>
          </select>
        </Field>
        <Button disabled={busy}>{busy ? "Searching…" : "Search"}</Button>
        {user && (
          <Button type="button" disabled={busy} onClick={personalize}>
            Use my research interests
          </Button>
        )}
      </form>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      <p aria-live="polite">
        {data
          ? `${data.total.toLocaleString()} matching records · page ${page}`
          : "Choose a topic to begin."}
      </p>
      <div className="intelligence-grid">
        {data?.records.map((r) => (
          <article className="panel" key={r.externalId}>
            <Badge>{r.provider}</Badge>
            <h3>{r.title}</h3>
            <p>{r.authors || r.institution}</p>
            <p>
              {[
                r.year,
                Number.isFinite(r.citations)
                  ? `${r.citations} citations`
                  : null,
                r.openAccess ? "Open access" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {r.abstract && (
              <details>
                <summary>Read abstract</summary>
                <p>{r.abstract}</p>
              </details>
            )}
            {r.topics?.length > 0 && <p>{r.topics.slice(0, 4).join(" · ")}</p>}
            <p>Retrieved {dateLabel(r.retrievedAt)}</p>
            <a href={r.url} target="_blank" rel="noreferrer">
              Open source record ↗
            </a>
            {r._id && r.kind === "works" && user && (
              <Button
                onClick={async () => {
                  try {
                    await api("/intelligence/save", {
                      method: "POST",
                      body: { record: r._id },
                    });
                    setError("Saved to your research library.");
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Save to library
              </Button>
            )}
          </article>
        ))}
      </div>
      {data?.records.length === 0 && (
        <div className="panel">
          No matching imported records. Switch to Live provider to search the
          source.
        </div>
      )}
      <div className="row">
        <Button disabled={busy || page === 1} onClick={() => search(page - 1)}>
          Previous
        </Button>
        <Button
          disabled={busy || !data || page * 20 >= data.total}
          onClick={() => search(page + 1)}
        >
          Next
        </Button>
      </div>
      <BangladeshRankings />
      <section className="panel">
        <h2>Bangladesh research and scientist directory</h2>
        <p>
          Choose OpenAlex → authors → Bangladesh → Live provider for current
          researcher records. Public profiles are external academic records, not
          Publixia member accounts. Rankings use their publisher's methodology
          and do not imply affiliation verification by Publixia.
        </p>
        <a
          href="https://topscinet.com/rankings/bgd/"
          target="_blank"
          rel="noreferrer"
        >
          TOPSCINET Bangladesh rankings
        </a>
        <p>
          <a
            href="https://scientificbangladesh.com/top-10-of-top-2-scientists-from-bangladesh-in-2026/"
            target="_blank"
            rel="noreferrer"
          >
            Scientific Bangladesh report from October 2026
          </a>
        </p>
      </section>
    </>
  );
}
export function CriteriaAdmin() {
  const { user } = useApp();
  const [versions, setVersions] = useState([]);
  const [runs, setRuns] = useState([]);
  const [form, setForm] = useState({
    name: "Academic research standard",
    domain: "general",
    instructions:
      "Assess clarity, evidence, research design, reproducibility, limitations and ethical reporting. Explain each concern and suggest a concrete improvement. Never invent results or references.",
    depth: "detailed",
    published: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("Cybersecurity");
  const [provider, setProvider] = useState("openalex");
  const [kind, setKind] = useState("works");
  async function load() {
    try {
      setVersions(await api("/intelligence/criteria"));
      setRuns(await api("/intelligence/imports"));
    } catch (e) {
      setMessage(e.message);
    }
  }
  useEffect(() => {
    if (user?.roles.includes("admin")) load();
  }, []);
  if (!user?.roles.includes("admin"))
    return <p>Administrator access required.</p>;
  async function publish(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/intelligence/criteria", { method: "POST", body: form });
      setMessage(
        "New criteria version saved. Published versions apply to future screenings.",
      );
      await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        title="AI criteria and research imports"
        description="Publish authority evaluation standards. Every report retains its original criteria snapshot; loading an old version lets you publish a rollback as a new version."
      />
      <p role="status">{message}</p>
      <form className="panel" onSubmit={publish}>
        <Field
          label="Criteria name"
          value={form.name}
          required
          minLength={3}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Field label="Research domain">
          <select
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
          >
            {["general", ...domains].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Evaluation instructions">
          <textarea
            rows={8}
            minLength={30}
            maxLength={12000}
            required
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </Field>
        <Field label="Feedback depth">
          <select
            value={form.depth}
            onChange={(e) => setForm({ ...form, depth: e.target.value })}
          >
            <option>concise</option>
            <option>detailed</option>
          </select>
        </Field>
        <div className="intelligence-grid">
          {["methodology", "evidence", "clarity", "ethics"].map((k) => (
            <Field
              key={k}
              label={`${k} weight`}
              type="number"
              min="0"
              max="100"
              value={form.weights?.[k] ?? 25}
              onChange={(e) =>
                setForm({
                  ...form,
                  weights: {
                    methodology: 25,
                    evidence: 25,
                    clarity: 25,
                    ethics: 25,
                    ...form.weights,
                    [k]: Number(e.target.value),
                  },
                })
              }
            />
          ))}
        </div>
        <label>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />{" "}
          Publish for future screenings
        </label>
        <p>
          <Button disabled={busy}>
            {busy ? "Saving…" : "Save new version"}
          </Button>
        </p>
        <details>
          <summary>Prompt preview</summary>
          <pre className="prompt-preview">{JSON.stringify(form, null, 2)}</pre>
        </details>
      </form>
      <section className="panel">
        <h2>Version history</h2>
        {versions.map((v) => (
          <div key={v._id}>
            <b>{v.name}</b> · {v.domain} · {v.published ? "Published" : "Draft"}{" "}
            · {dateLabel(v.createdAt)}{" "}
            <Button
              onClick={() =>
                setForm({
                  name: v.name,
                  domain: v.domain,
                  instructions: v.instructions,
                  depth: v.depth,
                  published: false,
                  weights: v.weights || {},
                })
              }
            >
              Load version
            </Button>
            <hr />
          </div>
        ))}
      </section>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await api("/intelligence/sync", {
              method: "POST",
              body: { provider, kind, q: query },
            });
            setMessage(`${r.records.length} source records imported.`);
            await load();
          } catch (e) {
            setMessage(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Synchronize public metadata</h2>
        <Field label="Source">
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setKind("works");
            }}
          >
            {["openalex", "crossref", "europepmc", "datacite"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {(provider === "openalex"
              ? ["works", "authors", "institutions", "sources", "topics"]
              : ["works"]
            ).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field
          label="Query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button disabled={busy}>
          {busy ? "Importing…" : "Retrieve and save records"}
        </Button>
      </form>
      <section className="panel">
        <h2>Import history</h2>
        {runs.map((r) => (
          <p key={r._id}>
            {r.provider} · {r.query} · {r.count} records · {r.status} ·{" "}
            {dateLabel(r.createdAt)} {r.error}
          </p>
        ))}
      </section>
    </>
  );
}
