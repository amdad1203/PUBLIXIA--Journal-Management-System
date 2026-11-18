import PublisherQueue from './PublisherQueue';
import {ReviewForm, ManuscriptWorkflow} from './Workflow';
import {editorialOf, productionOf, publicationOf} from '../../../shared/workspaces';
import React, { useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  BookOpen,
  Download,
  Upload,
  FileText,
  ArrowRight,
  Check,
  ShieldCheck,
} from "lucide-react";
import { api, dateLabel, label } from "../api";
import { useApp, useLoad, useAction } from "../context";
import {
  Heading,
  Load,
  Section,
  Field,
  Button,
  Badge,
  Status,
  Demo,
  Empty,
  SearchBox,
  PublicHeader,
} from "../components";
export function Journals() {
  const [q, setQ] = useState("");
  const { data, error } = useLoad("/journals?limit=100");
  return (
    <>
      <Heading
        eyebrow="PUBLISH WITH PURPOSE"
        title="Find a home for your research."
        description="Explore journal scopes, author guidance, and the work of your academic community."
      />
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search journals or research fields"
        />
        <span className="muted">{data?.length || 0} journals</span>
      </div>
      <Load data={data} error={error}>
        <div className="cards-grid">
          {data
            ?.filter((j) =>
              `${j.name} ${j.subject}`.toLowerCase().includes(q.toLowerCase()),
            )
            .map((j, i) => (
              <Link
                className="journal-card"
                key={j._id}
                to={`/journals/${j._id}`}
              >
                <div className={`journal-cover cover-${i % 4}`}>
                  <span>PUBLIXIA / JOURNAL SERIES</span>
                  <h2>{j.subject}</h2>
                  <div className="cover-line" />
                  <small>RESEARCH & PERSPECTIVES</small>
                  <BookOpen size={44} />
                </div>
                <div className="card-body">
                  <div className="row spread">
                    <Badge>Open access</Badge>
                    {j.synthetic && <Demo />}
                  </div>
                  <h3>{j.name}</h3>
                  <p>{j.description}</p>
                  <div className="row spread">
                    <small>{j.frequency}</small>
                    <ArrowUpRight size={19} />
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </Load>
    </>
  );
}
export function JournalDetail() {
  const { id } = useParams();
  const { data: d, error } = useLoad(`/journals/${id}`);
  const [tab, setTab] = useState("Overview");
  if(d?.journal.external)return <><Heading eyebrow="EXTERNAL JOURNAL" title={d.journal.name} description={d.journal.description} action={<a className="btn" href={d.journal.sourceUrl} target="_blank" rel="noreferrer">Official journal and submission information ↗</a>}/><section className="panel prose"><p>Submissions to this journal take place on the publisher's website.</p><p>Source checked {dateLabel(d.journal.sourceCheckedAt)}. Policies and charges may change.</p>{Object.entries(d.journal.sourceDetails||{}).filter(([key])=>!['id','title','official_url'].includes(key)).map(([key,value])=><div key={key}><h3>{label(key)}</h3><p>{Array.isArray(value)?value.join(', '):String(value)}</p></div>)}</section></>;
  return (
    <Load data={d} error={error}>
      {d && (
        <>
          <Heading
            eyebrow="JOURNAL PROFILE"
            title={d.journal.name}
            description={d.journal.description}
            action={
              <Link className="btn" to="/manuscripts">
                <Plus size={17} />
                Submit a manuscript
              </Link>
            }
          />
          <div className="tabs">
            {[
              "Overview",
              "Author guidelines",
              "Editorial board",
              "Published articles",
              "Policies",
            ].map((t) => (
              <button
                className={tab === t ? "active" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="panel prose">
            {d.journal.synthetic && <Demo />}
            {tab === "Overview" && (
              <>
                <h2>Aims & scope</h2>
                <p>{d.journal.description}</p>
                <p>
                  Subject: {d.journal.subject} · Frequency:{" "}
                  {d.journal.frequency}
                </p>
                <h3>Current issues</h3>
                {d.issues.map((i) => (
                  <p key={i._id}>
                    Volume {i.volume}, Issue {i.number} — {i.title}
                  </p>
                ))}
              </>
            )}
            {tab === "Author guidelines" && (
              <>
                <h2>Prepare your manuscript</h2>
                <p>{d.journal.guidelines}</p>
                <p>
                  Upload a text-based PDF, DOCX, or TXT file of up to 10 MB. The
                  original version is retained. Disclose all AI assistance and
                  review every proposed correction.
                </p>
              </>
            )}
            {tab === "Editorial board" && (
              <>
                <h2>Editorial board</h2>
                {d.journal.editors.map((e) => (
                  <p key={e._id}>
                    <b>{e.name}</b>
                    <br />
                    {e.affiliation}
                  </p>
                ))}
              </>
            )}
            {tab === "Published articles" && (
              <>
                <h2>Published research</h2>
                {d.articles.map((a) => (
                  <Link
                    key={a._id}
                    className="list-row"
                    to={`/articles/${a._id}`}
                  >
                    <FileText size={20} />
                    <div>
                      <h3>{a.title}</h3>
                      <small>{dateLabel(a.publishedAt)}</small>
                    </div>
                    <ArrowUpRight size={18} />
                  </Link>
                ))}
                {!d.articles.length && (
                  <Empty title="No articles published yet" />
                )}
              </>
            )}
            {tab === "Policies" && (
              <>
                <h2>Transparent research. Human judgment.</h2>
                <p>
                  Human reviewers evaluate submissions. Reviewer identities and
                  confidential comments are available only to authorized
                  editorial staff. AI pre-checks offer preliminary assistance
                  and do not determine acceptance.
                </p>
                <p>
                  Authors must disclose conflicts, funding, ethics approval,
                  data availability and AI use. Publixia does not currently
                  register DOIs, collect publication fees, or claim indexing.
                </p>
                <p>
                  Publication, licensing and retraction policies must be
                  reviewed by the operating publisher before real-world use.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </Load>
  );
}
export function Article() {
  const { id } = useParams();
  const { data: d, error } = useLoad(`/articles/${id}`);
  return (
    <>
      <PublicHeader />
      <div className="article-page">
        <Load data={d} error={error}>
          {d && (
            <>
              {d.article.synthetic && <Demo />}
              <div className="eyebrow">{d.article.journal.name}</div>
              <h1>{d.article.title}</h1>
              <p className="muted">
                {d.article.author.name} · {d.article.author.affiliation} ·{" "}
                {dateLabel(d.article.publishedAt)}
              </p>
              <section className="article-abstract">
                <p>DOI: {d.article.doi||'Pending'}{d.article.doi&&d.article.doiStatus!=='registered'?' (provided metadata; registration not verified)':''}</p>
                <p>{d.article.coauthors}</p>{d.article.issue&&<p>Volume {d.article.issue.volume} · Issue {d.article.issue.number}</p>}<p>Keywords: {d.article.keywords}</p><a className="btn secondary" href={`/api/articles/${id}/file`}>Download final article</a><h2>Abstract</h2>
                <p>{d.article.abstract}</p>
              </section>
              <div className="prose preserve">{d.text}</div>
            </>
          )}
        </Load>
      </div>
    </>
  );
}
export function Manuscripts({queue}) {
 if(['production','proofs','published'].includes(queue))return <PublisherQueue key={queue} queue={queue}/>;
 return <ManuscriptList queue={queue}/>;
}
function ManuscriptList({queue}) {
  const {workspaceRole}=useApp();
  const canCreate=workspaceRole==='researcher';
  const queueTitle=queue==='submissions'?'Submission Queue':queue==='decisions'?'Decision Center':queue==='production'?'Production Queue':queue==='proofs'?'Author Proofs':queue==='published'?'Published Articles':canCreate?'My Manuscripts':'Manuscripts';
  const { data, reload, error } = useLoad(`/manuscripts?limit=100&workspace=${workspaceRole}`);
  const { data: journals } = useLoad("/journals?limit=100");
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [form, setForm] = useState(false),
    [step, setStep] = useState(1);
  const { run, busy } = useAction();
  const nav = useNavigate();
  const [draft, setDraft] = useState({
    title: "",
    abstract: "",
    keywords: "",
    journal: "",
    coauthors: "",
    declarations: {
      ethics: "",
      consent: "",
      conflicts: "",
      funding: "",
      data: "",
      ai: "",
      contributions: "",
    },
  });
  const update = (k, v) => setDraft({ ...draft, [k]: v });
  const create = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    const m = await run(
      () =>
        api("/manuscripts", {
          method: "POST",
          body: { ...draft, journal: draft.journal || journals?.find(j=>!j.external)?._id },
        }),
      "Manuscript draft created. Upload the document next.",
    );
    if (m) nav(`/manuscripts/${m._id}`);
  };
  return (
    <>
      <Heading
        eyebrow="YOUR PUBLICATION JOURNEY"
        title={queueTitle}
        description={canCreate?"Prepare submissions, track decisions, respond to revisions and approve author proofs.":"Records available for your role and assigned journals. Open a record to perform the next permitted action."}
        action={
          canCreate && <Button onClick={() => setForm(!form)}>
            <Plus size={17} />
            {form ? "Close form" : "New manuscript"}
          </Button>
        }
      />
      {canCreate && form && (
        <section className="panel form-panel">
          <h2>Create a manuscript</h2>
          <div className="steps">
            {[
              "Journal & manuscript",
              "Authors & declarations",
              "Review draft",
            ].map((s, i) => (
              <span key={s} className={step === i + 1 ? "active" : ""}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          <form onSubmit={create}>
            {step === 1 && (
              <>
                <Field label="Journal">
                  <select
                    value={draft.journal}
                    onChange={(e) => update("journal", e.target.value)}
                    required
                  >
                    <option value="">Select a journal</option>
                    {journals?.filter(j=>!j.external).map((j) => (
                      <option value={j._id} key={j._id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Manuscript title"
                  value={draft.title}
                  onChange={(e) => update("title", e.target.value)}
                  required
                  maxLength={250}
                />
                <Field label="Abstract">
                  <textarea
                    value={draft.abstract}
                    onChange={(e) => update("abstract", e.target.value)}
                    required
                    minLength={30}
                    rows={5}
                  />
                </Field>
                <Field
                  label="Keywords, separated by commas"
                  value={draft.keywords}
                  onChange={(e) => update("keywords", e.target.value)}
                  required
                />
              </>
            )}
            {step === 2 && (
              <>
                <Field
                  label="Co-authors and affiliations"
                  value={draft.coauthors}
                  onChange={(e) => update("coauthors", e.target.value)}
                />
                <div className="form-grid">
                  {Object.entries({
                    ethics: "Ethics approval",
                    consent: "Participant consent",
                    conflicts: "Conflicts of interest",
                    funding: "Funding statement",
                    data: "Data availability",
                    ai: "AI usage disclosure",
                    contributions: "Author contributions",
                  }).map(([key, title]) => (
                    <Field key={key} label={title}>
                      <textarea
                        rows={2}
                        required
                        placeholder="Provide details, or explain why not applicable."
                        value={draft.declarations[key]}
                        onChange={(e) =>
                          update("declarations", {
                            ...draft.declarations,
                            [key]: e.target.value,
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </>
            )}
            {step === 3 && (
              <div className="prose">
                <h3>{draft.title}</h3>
                <p>{draft.abstract}</p>
                <p>
                  Journal:{" "}
                  {journals?.find((j) => j._id === draft.journal)?.name}
                </p>
                <p>
                  Your manuscript will be saved as a draft. Upload your document
                  and explicitly submit it from the manuscript workspace.
                </p>
              </div>
            )}
            <div className="row">
              {step > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              <Button disabled={busy}>
                {step < 3 ? "Continue" : "Create draft"}
                <ArrowRight size={17} />
              </Button>
            </div>
          </form>
        </section>
      )}
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search your manuscripts"
        />
        <select
          aria-label="Filter manuscript status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {[
            "draft",
            "submitted",
            "screening",
            "under_review",
            "revision",
            "accepted",
            "copyediting",
            "typesetting",
            "proofreading",
            "published",
            "rejected",
            "withdrawn",
          ].map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>
      <Load data={data} error={error}>
        <section className="panel table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Manuscript</th>
                  <th>Journal</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data
                  ?.filter(
                    (m) =>
                      m.title.toLowerCase().includes(q.toLowerCase()) &&
                      (!filter || m.status === filter || productionOf(m)===filter) &&
                      (queue!=='submissions'||['submitted','screening','revision','under_review'].includes(editorialOf(m))) &&
                      (queue!=='decisions'||['under_review','revision','accepted','rejected'].includes(editorialOf(m))) &&
                      (queue!=='proofs'||['proof_preparation','proof_sent','corrections_pending','approved'].includes(productionOf(m))) &&
                      (queue!=='published'||publicationOf(m)==='published') &&
                      (queue!=='production'||publicationOf(m)!=='published'),
                  )
                  .map((m) => (
                    <tr key={m._id}>
                      <td>
                        <small>{m.code}</small>
                        <Link to={`/manuscripts/${m._id}`}>
                          <b>{m.title}</b>
                        </Link>
                        {m.synthetic && <Demo />}
                      </td>
                      <td>{m.journal.name}</td>
                      <td>
                        <Status value={workspaceRole==='publisher'?productionOf(m):editorialOf(m)} />
                      </td>
                      <td className="nowrap">{dateLabel(m.updatedAt)}</td>
                      <td>
                        <Link
                          to={`/manuscripts/${m._id}`}
                          aria-label="Open manuscript"
                        >
                          <ArrowUpRight size={19} />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!data?.length && (
            <Empty
              title={canCreate?"Your first manuscript starts here":"No manuscripts in this workspace"}
              text={canCreate?"Create a draft, upload your paper, and prepare it for review.":"The preceding workflow action will bring eligible records into your queue."}
            />
          )}
        </section>
      </Load>
    </>
  );
}
export function ManuscriptDetail() {
  const { id } = useParams();
  const location=useLocation();
  const { data: d, error, reload } = useLoad(`/manuscripts/${id}`);
  const { user } = useApp();
  const { run, busy } = useAction();
  const [tab, setTab] = useState(new URLSearchParams(location.search).get('tab')||"Overview"),
    [reviewers, setReviewers] = useState([]),
    [issues, setIssues] = useState([]);
  const nav = useNavigate();
  React.useEffect(() => {
    if (d?.permissions.editor) {
      api("/reviewers")
        .then(setReviewers)
        .catch(() => {});
    }
    if (d?.permissions.production) {
      api(`/issues?journal=${d.manuscript.journal._id}`)
        .then(setIssues)
        .catch(() => {});
    }
  }, [d]);
  const action = async (path, body, message) => {
    const r = await run(() => api(path, { method: "POST", body }), message);
    if (r) reload();
    return r;
  };
  const upload = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const r = await run(
      () => api(`/manuscripts/${id}/versions`, { method: "POST", body: form }),
      "New version saved. The original is preserved.",
    );
    if (r) reload();
  };
  return (
    <Load data={d} error={error}>
      {d &&
        (() => {
          const m = d.manuscript,
            p = d.permissions;
          const latest = d.versions[0];
          const a = d.assignments.find(
            (a) =>
              String(a.reviewer?._id || a.reviewer) === user.id &&
              a.status === "accepted",
          );
          return (
            <>
              <Heading
                eyebrow={`${m.code} / ${m.journal.name}`}
                title={m.title}
                action={<Status value={m.status} />}
              />
              <div className="workflow-states">{[['Editorial',editorialOf(m)],['Production',productionOf(m)],['Publication',publicationOf(m)]].map(([name,state])=><div key={name}><small>{name}</small><Status value={state}/></div>)}</div>
              <div className="tabs">
                {[
                  "Overview",
                  "Documents & versions",
                  "Peer review",
                  "Editorial history",
                ].filter(t=>!(p.production&&!p.editor&&t==='Peer review')&&!(p.reviewer&&!p.editor&&!p.owner&&t==='Editorial history')).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={tab === t ? "active" : ""}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="detail-grid">
                <section className="panel prose">
                  {tab === "Overview" && (
                    <>
                      {m.synthetic && <Demo />}
                      <p>{d.article.coauthors}</p>{d.article.issue&&<p>Volume {d.article.issue.volume} · Issue {d.article.issue.number}</p>}<p>Keywords: {d.article.keywords}</p><a className="btn secondary" href={`/api/articles/${id}/file`}>Download final article</a><h2>Abstract</h2>
                      <p>{m.abstract}</p>
                      <h3>Keywords</h3>
                      <p>{m.keywords}</p>
                      <h3>Declarations</h3>
                      {Object.entries(m.declarations || {}).map(
                        ([key, value]) => (
                          <p key={key}>
                            <b>{label(key)}:</b> {value}
                          </p>
                        ),
                      )}
                    </>
                  )}
                  {tab === "Documents & versions" && (
                    <>
                      <h2>Manuscript versions</h2>
                      {p.owner && ["draft", "revision"].includes(m.status) && (
                        <form onSubmit={upload}>
                          <Field label="Upload PDF, DOCX, or TXT (up to 10 MB)">
                            <input
                              type="file"
                              name="file"
                              accept=".pdf,.docx,.txt"
                              required
                            />
                          </Field>
                          {m.status === "revision" && (
                            <Field label="Point-by-point response to reviewers">
                              <textarea name="response" required rows={5} />
                            </Field>
                          )}
                          <Button disabled={busy}>
                            <Upload size={17} />
                            Save new version
                          </Button>
                        </form>
                      )}
                      {d.versions.map((v) => (
                        <details className="version-card" key={v._id}>
                          <summary>
                            Version {v.number} · {v.filename}{" "}
                            <small>{dateLabel(v.createdAt)}</small>
                          </summary>
                          <p>
                            <a
                              href={`/api/manuscripts/${id}/versions/${v._id}/download`}
                              className="btn secondary small"
                            >
                              <Download size={15} />
                              Download original version
                            </a>
                          </p>
                          {v.response && (
                            <p>
                              <b>Response:</b> {v.response}
                            </p>
                          )}
                          <pre className="document-preview">{v.text}</pre>
                        </details>
                      ))}
                      {!d.versions.length && (
                        <Empty
                          title="Upload your first version"
                          text="Your original document is stored privately and kept separately from corrections."
                        />
                      )}
                    </>
                  )}
                  {tab === "Peer review" && (
                    <>
                      <h2>Human peer review</h2>
                      {d.assignments.map((as) => (
                        <div className="review-box" key={as._id}>
                          <div className="row spread">
                            <b>
                              {as.reviewer?.name || "Your review assignment"}
                            </b>
                            <Status value={as.status} />
                          </div>
                          <p>
                            Due {dateLabel(as.due)} · Version {as.round}
                          </p>
                          {as.status === "invited" &&
                            String(as.reviewer?._id || as.reviewer) ===
                              user.id && (
                              <div className="row">
                                {["accepted", "declined"].map((status) => (
                                  <Button
                                    key={status}
                                    variant={
                                      status === "declined" ? "secondary" : ""
                                    }
                                    disabled={busy}
                                    onClick={async () => {
                                      if(status==='accepted'&&!window.confirm('Confirm you have no conflict of interest and can meet the review deadline.'))return;
                                      const r = await run(
                                        () =>
                                          api(`/assignments/${as._id}`, {
                                            method: "PATCH",
                                            body: { status, ...(status==='accepted'?{conflictDeclared:false}:{}) },
                                          }),
                                        "Invitation updated.",
                                      );
                                      if (r) reload();
                                    }}
                                  >
                                    {label(status)}
                                  </Button>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                      {a && editorialOf(m)==='under_review' && <ReviewForm key={a._id} assignment={a} onSaved={reload}/>}
                      {d.reviews.map((r, i) => (
                        <div className="review-box" key={r._id || i}>
                          <h3>
                            {r.reviewer?.name || `Reviewer feedback ${i + 1}`}
                          </h3>
                          <Status value={r.recommendation} />
                          <p className="preserve">{r.authorComments}</p>
                          {r.confidentialComments && (
                            <div className="confidential">
                              <b>Confidential · editorial access only</b>
                              <p>{r.confidentialComments}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      {!d.reviews.length && !d.assignments.length && (
                        <Empty
                          title="No review feedback yet"
                          text="Review invitations and released feedback will appear here."
                        />
                      )}
                    </>
                  )}
                  {tab === "Editorial history" && (
                    <>
                      <h2>Editorial decisions & history</h2>
                      {(m.decisions||[]).map(dec=><div className="review-box" key={dec._id}><h3>{label(dec.type)} · Version {dec.version}</h3><small>{dateLabel(dec.at)}{dec.revisionDeadline&&` · Revision due ${dateLabel(dec.revisionDeadline)}`}</small><p className="preserve">{dec.letter}</p>{p.editor&&dec.internalNote&&<p className="confidential">{dec.internalNote}</p>}</div>)}
                      {(m.history||[]).map((h, i) => (
                        <div className="history-row" key={i}>
                          <Status value={h.status} />
                          <p>{h.note}</p>
                          <small>{dateLabel(h.at)}</small>
                        </div>
                      ))}
                    </>
                  )}
                </section>
                <aside className="detail-side">
                  <ManuscriptWorkflow data={d} reload={reload}/>
                  <Section title="Next steps">
                    {p.owner && ["draft", "revision"].includes(m.status) && (
                      <>
                        <p>
                          Upload your manuscript, check the declarations, and
                          submit when you are ready.
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => setTab("Documents & versions")}
                        >
                          <Upload size={16} />
                          Upload document
                        </Button>
                        <Button
                          disabled={busy || !latest}
                          onClick={() =>
                            action(
                              `/manuscripts/${id}/status`,
                              {
                                status: "submitted",
                                note: "Submitted by the corresponding author.",
                              },
                              "Manuscript submitted.",
                            )
                          }
                        >
                          Submit to journal
                          <ArrowRight size={16} />
                        </Button>
                      </>
                    )}
                    {p.owner && latest && (
                      <Link className="btn secondary" to="/screening">
                        <ShieldCheck size={16} />
                        Run AI pre-check
                      </Link>
                    )}
                    {p.editor && ["submitted","screening","under_review"].includes(editorialOf(m)) && (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const f = Object.fromEntries(
                            new FormData(e.currentTarget),
                          );
                          await action(
                            `/manuscripts/${id}/status`,
                            {
                              status: f.status,
                              note: f.note,
                              decisionType:f.status==='revision'?(f.decisionType||'major_revision'):undefined,internalNote:f.internalNote||undefined,revisionDeadline:f.revisionDeadline||undefined,
                              ...(f.status === "published"
                                ? {
                                    issue: f.issue,
                                    ...(f.doi ? { doi: f.doi } : {}),
                                  }
                                : {}),
                            },
                            "Editorial status updated.",
                          );
                        }}
                      >
                        <Field label="Editorial action">
                          <select name="status">
                            {(
                              {
                                submitted: ["screening", "revision", "rejected"],
                                screening: [
                                  "under_review",
                                  "revision",
                                  "rejected",
                                ],
                                under_review: [
                                  "revision",
                                  "accepted",
                                  "rejected",
                                ],
                                accepted: ["copyediting"],
                                copyediting: ["typesetting"],
                                typesetting: ["proofreading"],
                                proofreading: user.roles.some((r) =>
                                  ["publisher", "admin"].includes(r),
                                )
                                  ? ["published"]
                                  : [],
                              }[m.status] || []
                            ).map((s) => (
                              <option value={s} key={s}>
                                {label(s)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Revision type (when requesting revision)"><select name="decisionType"><option value="">Select if requesting revision</option><option value="minor_revision">Minor revision</option><option value="major_revision">Major revision</option><option value="technical_correction">Technical correction</option></select></Field>
                        <Field label="Revision deadline (optional)" name="revisionDeadline" type="date"/>
                        <Field label="Internal editorial note"><textarea name="internalNote"/></Field>
                        <Field label="Decision letter / editorial note">
                          <textarea
                            name="note"
                            rows={3}
                            required
                            minLength={10}
                          />
                        </Field>
                        {m.status === "proofreading" && (
                          <>
                            <Field label="Publication issue">
                              <select name="issue" required>
                                {issues.map((i) => (
                                  <option key={i._id} value={i._id}>
                                    Vol {i.volume} · Issue {i.number}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field
                              label="Registered DOI (optional)"
                              name="doi"
                              placeholder="10.xxxx/…"
                            />
                          </>
                        )}
                        <Button
                          disabled={
                            busy ||
                            ![
                              "submitted",
                              "screening",
                              "under_review",
                              "accepted",
                              "copyediting",
                              "typesetting",
                              "proofreading",
                            ].includes(m.status)
                          }
                        >
                          Record action
                        </Button>
                      </form>
                    )}
                    {p.owner &&
                      !["published", "rejected", "withdrawn"].includes(
                        m.status,
                      ) && (
                        <button
                          className="danger-link"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Withdraw this manuscript from editorial consideration?",
                              )
                            )
                              action(
                                `/manuscripts/${id}/status`,
                                {
                                  status: "withdrawn",
                                  note: "Withdrawn by author.",
                                },
                                "Manuscript withdrawn.",
                              );
                          }}
                        >
                          Withdraw manuscript
                        </button>
                      )}
                  </Section>
                  {p.editor &&
                    ["screening", "under_review"].includes(m.status) && (
                      <Section title="Invite a reviewer">
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await action(
                              `/manuscripts/${id}/assignments`,
                              Object.fromEntries(new FormData(e.currentTarget)),
                              "Review invitation sent to the notification queue.",
                            );
                          }}
                        >
                          <Field label="Reviewer">
                            <select name="reviewer" required>
                              {reviewers
                                .filter(
                                  (r) => r._id !== (m.author?._id || m.author),
                                )
                                .map((r) => (
                                  <option key={r._id} value={r._id}>
                                    {r.name} — {r.interests || r.affiliation} ({r.workload || 0} active)
                                  </option>
                                ))}
                            </select>
                          </Field>
                          <Field label="Invitation response deadline" name="responseDue" type="date" required/>
                          <Field label="Invitation message"><textarea name="invitationMessage"/></Field>
                          <Field
                            label="Review deadline"
                            name="due"
                            type="date"
                            required
                          />
                          <Button disabled={busy}>Send invitation</Button>
                        </form>
                      </Section>
                    )}
                  {p.editor &&
                    user.roles.some((r) =>
                      ["publisher", "admin"].includes(r),
                    ) && (
                      <Section title="Create publication issue">
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const f = Object.fromEntries(
                              new FormData(e.currentTarget),
                            );
                            const result = await action(
                              "/issues",
                              {
                                journal: m.journal._id,
                                title: f.title,
                                volume: Number(f.volume),
                                number: Number(f.number),
                              },
                              "Issue created.",
                            );
                          }}
                        >
                          <Field label="Issue title" name="title" required />
                          <div className="form-grid">
                            <Field
                              label="Volume"
                              name="volume"
                              type="number"
                              min="1"
                              defaultValue="1"
                              required
                            />
                            <Field
                              label="Number"
                              name="number"
                              type="number"
                              min="1"
                              defaultValue="2"
                              required
                            />
                          </div>
                          <Button disabled={busy}>Create issue</Button>
                        </form>
                      </Section>
                    )}
                  <div className="info-note">
                    <ShieldCheck size={20} />
                    <p>
                      Documents are private. AI suggestions never replace human
                      editorial decisions.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          );
        })()}
    </Load>
  );
}
