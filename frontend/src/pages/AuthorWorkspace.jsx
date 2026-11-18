import React, { useEffect, useState, useRef } from "react";
import WritingAssistant from './WritingAssistant';
import { Link, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api, dateLabel, label } from "../api";
import { useLoad, useAction, useApp } from "../context";
import { Heading, Field, Button, Load, Badge } from "../components";

const structures = {
  "Original research article": [
    "Title and author information",
    "Abstract",
    "Keywords",
    "Introduction",
    "Related work",
    "Problem formulation",
    "Materials and methods",
    "Results",
    "Discussion",
    "Conclusion and future work",
    "Declarations",
    "References",
  ],
  "Systematic literature review": [
    "Review question",
    "Protocol and registration",
    "Eligibility criteria",
    "Search strategy",
    "Study selection",
    "Quality appraisal",
    "Data extraction",
    "Evidence synthesis",
    "Limitations",
    "Conclusions",
    "References",
  ],
  "Scoping review": [
    "Objectives",
    "Eligibility criteria",
    "Search strategy",
    "Evidence selection",
    "Data charting",
    "Evidence map",
    "Gaps and limitations",
    "Conclusions",
    "References",
  ],
  "Research proposal": [
    "Problem statement",
    "Research question",
    "Objectives",
    "Literature and gap",
    "Proposed methods",
    "Data and ethics",
    "Analysis plan",
    "Timeline and resources",
    "Risks",
    "References",
  ],
  "Conference paper": [
    "Abstract",
    "Introduction",
    "Related work",
    "Methods",
    "Results",
    "Discussion",
    "Conclusion",
    "References",
  ],
  "Thesis or dissertation": [
    "Title and declarations",
    "Abstract",
    "Introduction",
    "Literature review",
    "Research design",
    "Methods",
    "Results",
    "Discussion",
    "Conclusions",
    "References",
    "Appendices",
  ],
  "Conference abstract": [
    "Background",
    "Objective",
    "Methods",
    "Results",
    "Conclusion",
  ],
  "Response to reviewers": [
    "Cover response",
    "Reviewer comments",
    "Point-by-point responses",
    "Changes and page references",
    "Unresolved issues",
  ],
  "Journal cover letter": [
    "Editor and journal",
    "Manuscript and article type",
    "Contribution and journal fit",
    "Ethics and exclusivity",
    "Corresponding author",
  ],
};
const guidance = {
  Results:
    "Report only observations from work actually performed. Link experiment records, uncertainty, tables and figures. Do not invent findings.",
  Methods:
    "Describe procedures, data provenance, controls, validation, assumptions and reproducibility.",
  References:
    "Use saved bibliographic records. Check every citation against the original source.",
  Abstract:
    "State the problem, objective, methods, main verified findings and conclusion. Do not introduce unsupported results.",
  Introduction:
    "Explain the specific problem, why it matters, evidence for the gap and your research question.",
  Discussion:
    "Interpret the findings against prior evidence. Discuss limitations, alternative explanations and scope of inference.",
};
const makeModules = (t) =>
  structures[t].map((title, i) => ({
    key: String(i),
    title,
    text: "",
    status: "not_started",
    sourceIds: [],
    resultIds: [],
  }));
export function ActiveProject() {
  const { data: projects } = useLoad("/projects?limit=100");
  const { data: context, reload } = useLoad("/author/context");
  const { run } = useAction();
  return (
    <div className="active-project">
      <label>
        Active project{" "}
        <select
          aria-label="Active research project"
          value={context?.project?._id || ""}
          onChange={async (e) => {
            const r = await run(() =>
              api("/author/context", {
                method: "PUT",
                body: { project: e.target.value || null },
              }),
            );
            if (r) {
              reload();
              window.dispatchEvent(new Event("project-change"));
            }
          }}
        >
          <option value="">No project selected</option>
          {projects?.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      {context?.project && (
        <>
          <span>{context.project.domain}</span>
          <Link to={`/plan?project=${context.project._id}`}>Research plan</Link>
          <Link
            to={`/discover?q=${encodeURIComponent(context.project.domain || context.project.title)}`}
          >
            Find evidence
          </Link>
        </>
      )}
    </div>
  );
}
export function AuthorHandbook() {
  const [handbook, setHandbook] = useState("");
  useEffect(() => {
    import("../content/author-guide.md?raw").then((m) =>
      setHandbook(m.default),
    );
  }, []);
  const [q, setQ] = useState(
    new URLSearchParams(window.location.search).get("q") || "",
  );
  const sections = handbook
    .split(/\n(?=# \d+\.)/)
    .slice(1)
    .filter((s) => {
      const n = Number(s.match(/^# (\d+)/)?.[1]);
      return n >= 2 && n <= 16;
    })
    .map((s) =>
      s
        .replace(/## Backend design rules for AI assistants[\s\S]*/, "")
        .replace(
          "Replace the current empty editor with this layout",
          "Workspace layout",
        ),
    );
  return (
    <>
      <Heading
        title="Author workspace handbook"
        description="Planning, evidence synthesis, writing, publication and research integrity guidance from your content pack."
      />
      <Field
        label="Search the handbook"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {sections
        .filter((s) => s.toLowerCase().includes(q.toLowerCase()))
        .map((s, i) => (
          <details className="panel guide-faq" key={i}>
            <summary>{s.split("\n")[0].replace(/^# /, "")}</summary>
            <div className="prose">
              <ReactMarkdown>{s.split("\n").slice(1).join("\n")}</ReactMarkdown>
            </div>
          </details>
        ))}
    </>
  );
}
function Details({ value }) {
  if (value == null) return null;
  if (Array.isArray(value))
    return (
      <ul>
        {value.map((v, i) => (
          <li key={i}>
            <Details value={v} />
          </li>
        ))}
      </ul>
    );
  if (typeof value === "object")
    return (
      <dl>
        {Object.entries(value)
          .filter(
            ([k]) =>
              ![
                "id",
                "title",
                "name",
                "source_url",
                "official_url",
                "profile_url",
                "verification",
                "verification_status",
                "last_verified",
              ].includes(k),
          )
          .map(([k, v]) => (
            <div key={k}>
              <dt>
                <b>{label(k)}</b>
              </dt>
              <dd>
                <Details value={v} />
              </dd>
            </div>
          ))}
      </dl>
    );
  return <span>{String(value)}</span>;
}
export function AuthorCatalog({ fixedKind }) {
  const [params] = useSearchParams();
  const [kind, setKind] = useState(
    fixedKind || params.get("kind") || "publications",
  );
  const [q, setQ] = useState("");
  const { data, error, reload } = useLoad(`/author/catalog?kind=${kind}`);
  const { user, notify } = useApp();
  const {data:following,reload:reloadFollowing}=useLoad(user?'/author/following':null);
  const { run, busy } = useAction();
  const [compare, setCompare] = useState([]);
  return (
    <>
      <Heading
        title="Research evidence and communities"
        description="Source-linked publications, people, venues and opportunities. Source-pack annotations are separate from independently retrieved metadata."
      />
      {!fixedKind && (
        <div className="tabs">
          {[
            "publications",
            "researchers",
            "journals",
            "opportunities",
            "conferences",
          ].map((k) => (
            <button
              className={kind === k ? "active" : ""}
              key={k}
              onClick={() => {
                setKind(k);
                setCompare([]);
              }}
            >
              {label(k)}
            </button>
          ))}
        </div>
      )}
      <Field
        label="Search records"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error && <Button onClick={reload}>Retry loading records</Button>}
      <Load data={data} error={error}>
        <div className="intelligence-grid">
          {data
            ?.filter((r) =>
              JSON.stringify(r.data).toLowerCase().includes(q.toLowerCase()),
            )
            .map((r) => (
              <article className="panel" key={r._id}>
                <Badge>
                  {r.data.status || r.data.profile_status || label(kind)}
                </Badge>
                <h3>{r.data.title || r.data.name}</h3>
                <p>
                  {r.data.summary ||
                    r.data.institution ||
                    r.data.venue ||
                    r.data.location}
                </p>
                {r.data.authors && <p>{r.data.authors.join(", ")}</p>}
                <p>
                  {r.data.deadline
                    ? `Source-listed deadline: ${dateLabel(r.data.deadline)}${new Date(r.data.deadline) < new Date() ? " · Closed" : ""}`
                    : r.data.submission_status}
                </p>
                <details>
                  <summary>Methods, evidence and record details</summary>
                  <Details value={r.data} />
                </details>
                <p>
                  <small>
                    {r.checkStatus} · Checked {dateLabel(r.checkedAt)}
                  </small>
                </p>
                <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                  Original source ↗
                </a>
                <div className="row">
                  {kind==='researchers'&&user&&<Button disabled={busy} variant="secondary" onClick={async()=>{const r2=await run(()=>api(`/author/catalog/${r._id}/follow`,{method:'PUT',body:{following:!following?.some(f=>f.record===r._id)}}));if(r2)reloadFollowing();}}>{following?.some(f=>f.record===r._id)?'Unfollow researcher':'Follow researcher'}</Button>}
                  {kind === "publications" && user && (
                    <Button
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            api(`/author/catalog/${r._id}/save`, {
                              method: "POST",
                            }),
                          "Saved to your library and literature matrix.",
                        )
                      }
                    >
                      Save to library
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(r.sourceUrl);
                        notify("Source link copied.");
                      } catch {
                        notify(
                          "Copy the original source link from your browser.",
                          true,
                        );
                      }
                    }}
                  >
                    Share
                  </Button>
                  <label>
                    <input
                      type="checkbox"
                      checked={compare.includes(r._id)}
                      disabled={!compare.includes(r._id) && compare.length >= 3}
                      onChange={(e) =>
                        setCompare(
                          e.target.checked
                            ? [...compare, r._id]
                            : compare.filter((id) => id !== r._id),
                        )
                      }
                    />{" "}
                    Compare
                  </label>
                </div>
              </article>
            ))}
        </div>
        {data?.length === 0 && (
          <p>No records are available. Try live Research discovery.</p>
        )}
        {compare.length > 0 && (
          <section className="panel">
            <h2>Compare selected records</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Method or area</th>
                    <th>Evidence or scope</th>
                    <th>Source status</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    ?.filter((r) => compare.includes(r._id))
                    .map((r) => (
                      <tr key={r._id}>
                        <td>{r.data.title || r.data.name}</td>
                        <td>
                          <Details
                            value={
                              r.data.methodology || r.data.areas || r.data.scope
                            }
                          />
                        </td>
                        <td>
                          <Details
                            value={
                              r.data.findings ||
                              r.data.summary ||
                              "Consult original source"
                            }
                          />
                        </td>
                        <td>{r.checkStatus}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </Load>
    </>
  );
}
const planSections = [
  "Research area and problem",
  "Research question and objectives",
  "Literature and evidence map",
  "Gap and contribution",
  "Methodology and study design",
  "Data materials and ethics",
  "Experiment and analysis plan",
  "Risks and feasibility",
  "Manuscript and dissemination",
];
export function ResearchPlan() {
  const [params] = useSearchParams();
  const { data: projects } = useLoad("/projects?limit=100");
  const [project, setProject] = useState(params.get("project") || "");
  const { data, error } = useLoad(
    project ? `/author/projects/${project}/plan` : null,
  );
  const [sections, setSections] = useState({});
  const [dirty, setDirty] = useState(false);
  const { run, busy } = useAction();
  useEffect(() => {
    if (data) {
      setSections(data.plan.sections || {});
      setDirty(false);
    }
  }, [data]);
  return (
    <>
      <Heading
        title="Research plan"
        description="Make the question, evidence, methods, experiments and constraints explicit. Save the plan before creating a manuscript."
      />
      <Field label="Project">
        <select
          value={project}
          onChange={(e) => {
            if (dirty && !window.confirm("Discard unsaved plan changes?"))
              return;
            setProject(e.target.value);
          }}
        >
          <option value="">Choose a project</option>
          {projects?.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
      </Field>
      {project ? (
        <Load data={data} error={error}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(
                () =>
                  api(`/author/projects/${project}/plan`, {
                    method: "PUT",
                    body: { sections },
                  }),
                "Research plan saved.",
              );
              if (r) setDirty(false);
            }}
          >
            {planSections.map((title, i) => (
              <section className="panel" key={title}>
                <Field label={`${i + 1}. ${title}`}>
                  <textarea
                    rows={5}
                    value={sections[title] || ""}
                    onChange={(e) => {
                      setSections({ ...sections, [title]: e.target.value });
                      setDirty(true);
                    }}
                    placeholder="Record the decision, its supporting evidence, what is uncertain, and your next step."
                  />
                </Field>
              </section>
            ))}
            <div className="row">
              <Button disabled={busy}>
                {dirty ? "Save plan" : "Plan saved"}
              </Button>
              <Link className="btn secondary" to="/studio">
                Create manuscript outline
              </Link>
              <Link to="/author-handbook">Planning guidance</Link>
            </div>
          </form>
        </Load>
      ) : (
        <p>
          Create or select a project to start.{" "}
          <Link to="/projects">Open project workspace</Link>
        </p>
      )}
    </>
  );
}
export function StructuredStudio() {
  const { data: docs, error, reload } = useLoad("/documents");
  const { data: papers } = useLoad("/papers?limit=100");
  const { run, busy } = useAction();
  const [doc, setDoc] = useState(null);
  const docRef=useRef(doc);docRef.current=doc;
  const [template, setTemplate] = useState(Object.keys(structures)[0]);
  const [selected, setSelected] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState("Editor");
  const [title, setTitle] = useState("");
  const [result, setResult] = useState({
    title: "",
    dataset: "",
    method: "",
    findings: "",
    limitations: "",
  });
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const open = async (id) => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    const d = await run(() => api(`/documents/${id}`));
    if (d) {
      if (!d.workspace)
        d.workspace = {
          template: "Imported draft",
          revision: 0,
          modules: [
            {
              key: "original",
              title: "Original draft",
              text: d.content || "",
              status: "draft",
              sourceIds: [],
              resultIds: [],
            },
          ],
          results: [],
          versions: [],
        };
      setDoc(d);
      setSelected(0);
      setDirty(false);
    }
  };
  const changeModule = (patch) => {
    setDoc({
      ...doc,
      workspace: {
        ...doc.workspace,
        modules: doc.workspace.modules.map((m, i) =>
          i === selected ? { ...m, ...patch } : m,
        ),
      },
    });
    setDirty(true);
  };
  const save = async () => {
    const { versions, ...workspace } = doc.workspace;
    const d = await run(
      () =>
        api(`/author/documents/${doc._id}`, { method: "PUT", body: workspace }),
      "Manuscript modules saved.",
    );
    if (d) {
      if(docRef.current===doc){setDoc(d);setDirty(false);}
      else if(docRef.current?._id===doc._id)setDoc(current=>({...current,workspace:{...current.workspace,revision:d.workspace.revision,versions:d.workspace.versions}}));
      reload();
    }
  };
  const module = doc?.workspace.modules[selected];
  useEffect(()=>{
    if(!dirty||!doc||busy)return;
    const timer=setTimeout(()=>save(),5000);
    return ()=>clearTimeout(timer);
  },[doc,dirty,busy]);
  return (
    <>
      <Heading
        title="Manuscript writing studio"
        description="Develop connected sections, cite saved evidence, link experiment records and review each revision."
        action={<Link to="/studio/legacy">Open classic editor</Link>}
      />
      <div className="author-studio">
        <aside className="panel">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              const context = await run(() => api("/author/context"));
              const d = await run(() =>
                api("/documents", {
                  method: "POST",
                  body: { title, type: "paper", content: "" },
                }),
              );
              if (d) {
                const modules = makeModules(template);
                const plan = context?.project?.plan?.sections;
                if (plan) {
                  for (const m of modules) {
                    if (/Introduction|Problem|Research question/.test(m.title))
                      m.text =
                        plan["Research question and objectives"] ||
                        plan["Research area and problem"] ||
                        "";
                    if (/Methods|methods|method/.test(m.title))
                      m.text = plan["Methodology and study design"] || "";
                  }
                }
                setDoc({
                  ...d,
                  workspace: {
                    template,
                    revision: 0,
                    project: context?.project?._id || null,
                    modules,
                    results: [],
                    versions: [],
                  },
                });
                setSelected(0);
                setDirty(true);
                reload();
              }
            }}
          >
            <Field
              label="Working title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Field label="Academic template">
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                {Object.keys(structures).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Button disabled={busy}>Create structured draft</Button>
          </form>
          <h3>Your documents</h3>
          <Load data={docs} error={error}>
            {docs?.map((d) => (
              <button
                className="draft-item"
                key={d._id}
                onClick={() => open(d._id)}
              >
                {d.title}
              </button>
            ))}
          </Load>
          {doc && (
            <>
              <h3>Document outline</h3>
              {doc.workspace.modules.map((m, i) => (
                <button
                  className={`draft-item ${i === selected ? "active" : ""}`}
                  key={m.key}
                  onClick={() => setSelected(i)}
                >
                  {m.title}
                  <small>{label(m.status)}</small>
                </button>
              ))}
            </>
          )}
        </aside>
        <section className="panel">
          {doc && module ? (
            <>
              <h2>{doc.title}</h2>
              <div className="tabs">
                {[
                  "Editor",
                  "Evidence",
                  "Experiments",
                  "Readiness",
                  "History",
                ].map((v) => (
                  <button
                    key={v}
                    className={view === v ? "active" : ""}
                    onClick={() => setView(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {view === "Editor" && (
                <>
                  <h3>{module.title}</h3>
                  <p className="muted">
                    {guidance[module.title] ||
                      "Write the section in your own words, link supporting evidence, and distinguish planned work from completed findings."}
                  </p>
                  <Field label="Module status">
                    <select
                      value={module.status}
                      onChange={(e) => changeModule({ status: e.target.value })}
                    >
                      {[
                        "not_started",
                        "draft",
                        "needs_evidence",
                        "needs_review",
                        "complete",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Section text">
                    <textarea
                      className="module-editor"
                      rows={18}
                      value={module.text}
                      onChange={(e) =>
                        changeModule({
                          text: e.target.value,
                          status:
                            module.status === "not_started"
                              ? "draft"
                              : module.status,
                        })
                      }
                    />
                  </Field>
                  <small>
                    {module.text.trim().split(/\s+/).filter(Boolean).length}{" "}
                    words · {module.sourceIds.length} linked sources
                  </small>
                </>
              )}
              {view === "Evidence" && (
                <>
                  <h3>Evidence for {module.title}</h3>
                  {papers?.map((p) => (
                    <article className="source-row" key={p._id}>
                      <b>{p.title}</b>
                      <p>
                        {p.authors} · {p.year}
                      </p>
                      <Button
                        onClick={() =>
                          changeModule({
                            text: module.text + ` [PX-${p._id.slice(-6)}]`,
                            sourceIds: [
                              ...new Set([...module.sourceIds, p._id]),
                            ],
                          })
                        }
                      >
                        Insert citation and link source
                      </Button>
                      <a
                        href={p.url || `https://doi.org/${p.doi}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Original record ↗
                      </a>
                    </article>
                  ))}
                  {!papers?.length && (
                    <Link to="/author-sources">
                      Find and save source records
                    </Link>
                  )}
                </>
              )}
              {view === "Experiments" && (
                <>
                  <h3>Experiment and result records</h3>
                  <p>
                    Record only work performed. Keep planned analyses in the
                    research plan.
                  </p>
                  {Object.keys(result).map((k) => (
                    <Field
                      key={k}
                      label={label(k)}
                      value={result[k]}
                      onChange={(e) =>
                        setResult({ ...result, [k]: e.target.value })
                      }
                    />
                  ))}
                  <Button
                    disabled={!result.title.trim()}
                    onClick={() => {
                      setDoc({
                        ...doc,
                        workspace: {
                          ...doc.workspace,
                          results: [
                            ...(doc.workspace.results || []),
                            { ...result, key: crypto.randomUUID() },
                          ],
                        },
                      });
                      setResult({
                        title: "",
                        dataset: "",
                        method: "",
                        findings: "",
                        limitations: "",
                      });
                      setDirty(true);
                    }}
                  >
                    Add experiment record
                  </Button>
                  {doc.workspace.results?.map((r) => (
                    <article className="source-row" key={r.key}>
                      <h4>{r.title}</h4>
                      <p>{r.findings}</p>
                      <label>
                        <input
                          type="checkbox"
                          checked={module.resultIds.includes(r.key)}
                          onChange={(e) =>
                            changeModule({
                              resultIds: e.target.checked
                                ? [...module.resultIds, r.key]
                                : module.resultIds.filter((k) => k !== r.key),
                            })
                          }
                        />{" "}
                        Link to {module.title}
                      </label>
                    </article>
                  ))}
                </>
              )}
              {view === "Readiness" && (
                <>
                  <h3>Reporting checklist</h3>
                  <p>
                    This checklist reports document state; it does not certify
                    scientific validity.
                  </p>
                  {doc.workspace.modules.map((m) => (
                    <p key={m.key}>
                      {m.text.trim() ? "✓" : "○"} {m.title} · {label(m.status)}{" "}
                      · {m.sourceIds.length} linked sources
                    </p>
                  ))}
                  <Link to="/screening">Open manuscript pre-check</Link>
                  <p>
                    Save and export this draft, then upload it to your
                    manuscript before running AI screening.
                  </p>
                </>
              )}
              {view === "History" && (
                <>
                  <h3>Saved revisions</h3>
                  {doc.workspace.versions?.map((v, i) => (
                    <div className="source-row" key={i}>
                      <p>
                        Revision {v.revision} · {dateLabel(v.at)}
                      </p>
                      <details>
                        <summary>Read saved text</summary>
                        <pre className="prompt-preview">{v.content}</pre>
                      </details>
                      <Button
                        disabled={!v.modules?.length}
                        onClick={() => {
                          setDoc({
                            ...doc,
                            workspace: { ...doc.workspace, modules: v.modules,results:v.results||[],template:v.template||doc.workspace.template },
                          });
                          setSelected(0);
                          setDirty(true);
                        }}
                      >
                        Restore as editable draft
                      </Button>
                    </div>
                  ))}
                </>
              )}
              <div className="row">
                <Button disabled={busy} onClick={save}>
                  {busy ? "Saving…" : dirty ? "Save changes" : "Save revision"}
                </Button>
                {!dirty && (
                  <a
                    className="btn secondary"
                    href={`/api/documents/${doc._id}/export`}
                  >
                    Export DOCX
                  </a>
                )}
                <span className="muted">{busy?'Saving…':dirty?'Autosave pending':'All changes saved'}</span>
              </div>
              <WritingAssistant passage={module?.text||''} sourceIds={module?.sourceIds||[]}/>
            </>
          ) : (
            <>
              <h2>Choose a structure for your next manuscript</h2>
              <p>
                Select one of nine academic templates. Each creates an editable
                outline with status, evidence links and revision history. Your
                existing drafts are available in the document list.
              </p>
              <div className="intelligence-grid">
                {Object.entries(structures).map(([t, modules]) => (
                  <button
                    className="panel"
                    key={t}
                    onClick={() => setTemplate(t)}
                  >
                    <h3>{t}</h3>
                    <p>{modules.join(" · ")}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
