import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  FolderKanban,
  CalendarDays,
  Download,
  Trash2,
  Search,
  BookOpen,
  ExternalLink,
  Save,
  Users,
  MessageSquare,
  FileText,
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
  Progress,
} from "../components";
export function Projects() {
  const { data, error, reload } = useLoad("/projects");
  const [q, setQ] = useState(""),
    [show, setShow] = useState(false);
  const { busy, run } = useAction();
  const nav = useNavigate();
  return (
    <>
      <Heading
        eyebrow="SMALL STEPS. MEANINGFUL PROGRESS."
        title="Your research planner"
        description="Give your next discovery a clear direction, a timeline, and room to grow."
        action={<div className="compact-actions"><Link className="btn secondary" to="/plan">Study design & plan</Link>
          <Button onClick={() => setShow(!show)}>
            <Plus size={17} />
            New project
          </Button></div>
        }
      />
      {show && (
        <section className="panel form-panel">
          <h2>Start a research project</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const body = Object.fromEntries(new FormData(e.currentTarget));
              if (!body.due) delete body.due;
              const p = await run(
                () => api("/projects", { method: "POST", body }),
                "Project created.",
              );
              if (p) nav(`/projects/${p._id}`);
            }}
          >
            <div className="form-grid">
              <Field label="Project title" name="title" required />
              <Field label="Research field" name="domain" />
              <Field label="Target date" type="date" name="due" />
              <Field label="Research objectives" name="objectives" />
            </div>
            <Field label="Description">
              <textarea name="description" rows={3} />
            </Field>
            <Button disabled={busy}>
              Create project
              <ArrowUpRight size={16} />
            </Button>
          </form>
        </section>
      )}
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search your projects"
        />
        <span className="muted">{data?.length || 0} projects</span>
      </div>
      <Load data={data} error={error}>
        <div className="cards-grid">
          {data
            ?.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
            .map((p, i) => {
              const done = p.tasks.filter((t) => t.status === "done").length;
              return (
                <Link
                  className="project-preview"
                  key={p._id}
                  to={`/projects/${p._id}`}
                >
                  <div className="row spread">
                    <span className={`project-initial tone-${i % 3}`}>
                      <FolderKanban size={23} />
                    </span>
                    <Status value={p.status} />
                  </div>
                  <small>{p.domain}</small>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <div className="row spread">
                    <small>
                      {done} of {p.tasks.length} tasks complete
                    </small>
                    <b>
                      {p.tasks.length
                        ? Math.round((done / p.tasks.length) * 100)
                        : 0}
                      %
                    </b>
                  </div>
                  <Progress
                    value={p.tasks.length ? (done / p.tasks.length) * 100 : 0}
                  />
                  <div className="project-meta">
                    <span>
                      <CalendarDays size={14} />
                      {dateLabel(p.due)}
                    </span>
                    <span>
                      <Users size={14} />
                      {p.members.length + 1}
                    </span>
                  </div>
                  {p.synthetic && <Demo />}
                </Link>
              );
            })}
        </div>
        {!data?.length && (
          <Empty
            title="Make space for your next idea"
            text="Create a project to organize tasks, deadlines and collaborators."
          />
        )}
      </Load>
    </>
  );
}
export function ProjectDetail() {
  const { id } = useParams();
  const { data: d, error, reload } = useLoad(`/projects/${id}`);
  const { user } = useApp();
  const { run, busy } = useAction();
  const [tab, setTab] = useState("Board"),
    [newTask, setNewTask] = useState(false);
  const nav = useNavigate();
  const mutate = async (path, method, body, message) => {
    const r = await run(() => api(path, { method, body }), message);
    if (r) reload();
    return r;
  };
  return (
    <Load data={d} error={error}>
      {d && (
        <>
          <Heading
            eyebrow={d.project.domain || "RESEARCH PROJECT"}
            title={d.project.title}
            description={d.project.objectives || d.project.description}
            action={
              <Button onClick={() => setNewTask(!newTask)}>
                <Plus size={17} />
                New task
              </Button>
            }
          />
          <div className="row project-summary">
            <Status value={d.project.status} />
            <span>
              <CalendarDays size={16} />
              {dateLabel(d.project.due)}
            </span>
            <span>
              {d.tasks.filter((t) => t.status === "done").length}/
              {d.tasks.length} complete
            </span>
            {d.project.synthetic && <Demo />}
          </div>
          {newTask && (
            <section className="panel">
              <form
                className="inline-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = Object.fromEntries(new FormData(e.currentTarget));
                  f.milestone = f.milestone === "on";
                  if (!f.due) delete f.due;
                  if (!f.assignee) delete f.assignee;
                  const result = await mutate(
                    `/projects/${id}/tasks`,
                    "POST",
                    f,
                    "Task created.",
                  );
                  if (result) setNewTask(false);
                }}
              >
                <Field label="Task title" name="title" required />
                <Field label="Assign to"><select name="assignee"><option value="">Unassigned</option><option value={d.project.owner}>Project owner</option>{d.project.members.map(m=><option value={m._id} key={m._id}>{m.name}</option>)}</select></Field>
                <Field label="Deadline" name="due" type="date" />
                <Field label="Priority">
                  <select name="priority">
                    <option>medium</option>
                    <option>high</option>
                    <option>low</option>
                  </select>
                </Field>
                <label className="check-label">
                  <input name="milestone" type="checkbox" />
                  Milestone
                </label>
                <Button disabled={busy}>Add task</Button>
              </form>
            </section>
          )}
          <div className="tabs">
            {["Board", "Milestones", "Team & feedback", "Project settings"].map(
              (t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          {tab === "Board" && (
            <div className="kanban">
              {["todo", "in_progress", "review", "done"].map((status) => (
                <section
                  className="kanban-column"
                  key={status}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData("text/plain");
                    if (d.tasks.some((t) => t._id === taskId))
                      mutate(
                        `/tasks/${taskId}`,
                        "PATCH",
                        { status },
                        "Task moved.",
                      );
                  }}
                >
                  <h3>
                    <span className={`column-dot ${status}`} />
                    {label(status === "todo" ? "to_do" : status)}
                    <span>
                      {d.tasks.filter((t) => t.status === status).length}
                    </span>
                  </h3>
                  {d.tasks
                    .filter((t) => t.status === status)
                    .map((t) => (
                      <article
                        className="task-card"
                        key={t._id}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", t._id)
                        }
                      >
                        <div className="row spread">
                          <Badge tone={t.priority === "high" ? "pink" : ""}>
                            {t.priority}
                          </Badge>
                          {t.milestone && <small>Milestone</small>}
                        </div>
                        <h4>{t.title}</h4>
                        <Field label="Assigned to"><select value={t.assignee||''} disabled={busy} onChange={e=>mutate(`/tasks/${t._id}`,'PATCH',{assignee:e.target.value||null},'Assignment updated.')}><option value="">Unassigned</option><option value={d.project.owner}>Project owner</option>{d.project.members.map(m=><option key={m._id} value={m._id}>{m.name}</option>)}</select></Field>
                        <small>
                          <CalendarDays size={13} />
                          {dateLabel(t.due)}
                        </small>
                        <div className="row">
                          <select
                            aria-label={`Move ${t.title}`}
                            value={t.status}
                            onChange={(e) =>
                              mutate(
                                `/tasks/${t._id}`,
                                "PATCH",
                                { status: e.target.value },
                                "Task moved.",
                              )
                            }
                            disabled={busy}
                          >
                            {["todo", "in_progress", "review", "done"].map(
                              (s) => (
                                <option key={s} value={s}>
                                  {label(s)}
                                </option>
                              ),
                            )}
                          </select>
                          <button
                            className="icon-button"
                            title="Delete task"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm("Delete this task?"))
                                mutate(
                                  `/tasks/${t._id}`,
                                  "DELETE",
                                  undefined,
                                  "Task deleted.",
                                );
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </article>
                    ))}
                </section>
              ))}
            </div>
          )}
          {tab === "Milestones" && (
            <Section title="Research milestones">
              {d.tasks
                .filter((t) => t.milestone)
                .map((t) => (
                  <div className="list-row" key={t._id}>
                    <FolderKanban size={20} />
                    <div className="grow">
                      <h3>{t.title}</h3>
                      <small>{dateLabel(t.due)}</small>
                    </div>
                    <Status value={t.status} />
                  </div>
                ))}
              {!d.tasks.some((t) => t.milestone) && (
                <Empty
                  title="Define a milestone"
                  text="Create a task and select “Milestone” to mark an important research outcome."
                />
              )}
            </Section>
          )}
          {tab === "Team & feedback" && (
            <div className="two-columns">
              <Section title="Project collaborators">
                {d.project.members.map((m) => (
                  <div className="list-row" key={m._id}>
                    <div className="avatar">{m.name[0]}</div>
                    <div className="grow">
                      <b>{m.name}</b>
                      <small>{m.affiliation}</small>
                    </div>
                    {(user.id === d.project.owner || user.id === m._id) && (
                      <button
                        className="icon-button"
                        title="Remove member"
                        onClick={() =>
                          mutate(
                            `/projects/${id}/members/${m._id}`,
                            "DELETE",
                            undefined,
                            "Membership updated.",
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {user.id === d.project.owner && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await mutate(
                        `/projects/${id}/members`,
                        "POST",
                        Object.fromEntries(new FormData(e.currentTarget)),
                        "Collaborator added and notified.",
                      );
                    }}
                  >
                    <Field
                      label="Add by registered email"
                      name="email"
                      type="email"
                      required
                    />
                    <Button disabled={busy}>
                      <Plus size={16} />
                      Add collaborator
                    </Button>
                  </form>
                )}
              </Section>
              <Section title="Research feedback">
                {d.project.feedback.map((f, i) => (
                  <div className="feedback" key={i}>
                    <b>{f.by?.name || "Team member"}</b>
                    <p className="preserve">{f.text}</p>
                    <small>{dateLabel(f.at)}</small>
                  </div>
                ))}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const r = await mutate(
                      `/projects/${id}/feedback`,
                      "POST",
                      Object.fromEntries(new FormData(form)),
                      "Feedback posted.",
                    );
                    if (r) form.reset();
                  }}
                >
                  <Field label="Add feedback or a research note">
                    <textarea name="text" rows={4} required />
                  </Field>
                  <Button disabled={busy}>
                    <MessageSquare size={16} />
                    Post feedback
                  </Button>
                </form>
              </Section>
            </div>
          )}
          {tab === "Project settings" && (
            <Section title="Project details">
              {user.id === d.project.owner ? (
                <>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const b = Object.fromEntries(
                        new FormData(e.currentTarget),
                      );
                      if (!b.due) delete b.due;
                      await mutate(
                        `/projects/${id}`,
                        "PATCH",
                        b,
                        "Project saved.",
                      );
                    }}
                  >
                    <Field
                      label="Title"
                      name="title"
                      defaultValue={d.project.title}
                      required
                    />
                    <Field label="Description">
                      <textarea
                        name="description"
                        defaultValue={d.project.description}
                      />
                    </Field>
                    <Field label="Objectives">
                      <textarea
                        name="objectives"
                        defaultValue={d.project.objectives}
                      />
                    </Field>
                    <div className="form-grid">
                      <Field
                        label="Target date"
                        name="due"
                        type="date"
                        defaultValue={d.project.due?.slice(0, 10)}
                      />
                      <Field label="Status">
                        <select name="status" defaultValue={d.project.status}>
                          <option>active</option>
                          <option>paused</option>
                          <option>completed</option>
                        </select>
                      </Field>
                    </div>
                    <Button disabled={busy}>Save changes</Button>
                  </form>
                  <button
                    className="danger-link"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Permanently delete this project and all its tasks?",
                        )
                      ) {
                        const r = await run(
                          () => api(`/projects/${id}`, { method: "DELETE" }),
                          "Project deleted.",
                        );
                        if (r) nav("/projects");
                      }
                    }}
                  >
                    Delete project and tasks
                  </button>
                </>
              ) : (
                <p>Only the project owner can edit these details.</p>
              )}
            </Section>
          )}
        </>
      )}
    </Load>
  );
}
export function Research() {
  const { data: papers, error, reload } = useLoad("/papers?limit=100");
  const [tab, setTab] = useState("My library"),
    [q, setQ] = useState(""),
    [results, setResults] = useState(null),
    [editing, setEditing] = useState(null);
  const { run, busy } = useAction();
  const { notify } = useApp();
  return (
    <>
      <Heading
        eyebrow="TURN INFORMATION INTO INSIGHT"
        title="Your research library"
        description="Find real literature, keep your sources close, and build a clearer picture of the evidence."
        action={<Link className="btn secondary" to="/author-sources">Browse source evidence</Link>}
      />
      <div className="tabs">
        {[
          "My library",
          "Discover papers",
          "Literature matrix",
          "Research tools",
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              setQ("");
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Discover papers" ? (
        <>
          <form
            className="toolbar"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(() =>
                api(`/papers/search?q=${encodeURIComponent(q)}`),
              );
              if (r) setResults(r);
            }}
          >
            <SearchBox
              value={q}
              onChange={setQ}
              placeholder="Search by topic, author, title, or DOI"
            />
            <Button disabled={busy || q.length < 2}>
              <Search size={17} />
              {busy ? "Searching…" : "Search Crossref"}
            </Button>
          </form>
          <p className="muted">
            Live metadata from Crossref. Verify each source before citing it.
          </p>
          {results?.papers.map((p, i) => (
            <article className="panel paper-result" key={p.doi || i}>
              <Badge>{p.source}</Badge>
              <h3>{p.title}</h3>
              <p>
                {p.authors} · {p.year}
              </p>
              <p>{p.abstract || "No abstract is available from the source."}</p>
              <div className="row">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    const r = await run(
                      () => api("/papers", { method: "POST", body: p }),
                      "Saved to your library.",
                    );
                    if (r) reload();
                  }}
                >
                  <Plus size={16} />
                  Save paper
                </Button>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    Original source <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </article>
          ))}
          {!results && (
            <Empty
              title="Follow your research question"
              text="Search millions of scholarly records through Crossref."
            />
          )}
        </>
      ) : tab === "Research tools" ? (
        <div className="cards-grid">
          {[
            [
              "Consensus",
              "Search and synthesize peer-reviewed evidence.",
              "https://consensus.app",
            ],
            [
              "SciSpace",
              "Read papers and explore research literature.",
              "https://scispace.com",
            ],
            [
              "Undermind",
              "Plan in-depth searches for relevant research.",
              "https://undermind.ai",
            ],
          ].map(([name, description, url]) => (
            <a
              key={name}
              className="tool-card panel"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              <BookOpen size={26} />
              <h3>{name}</h3>
              <p>{description}</p>
              <span className="text-link">
                Open research tool
                <ExternalLink size={16} />
              </span>
              <small>External service · separate account may be required</small>
            </a>
          ))}
        </div>
      ) : (
        <Load data={papers} error={error}>
          <div className="toolbar">
            <SearchBox
              value={q}
              onChange={setQ}
              placeholder="Search saved papers"
            />
            <Button
              variant="secondary"
              onClick={() =>
                setEditing({
                  title: "",
                  authors: "",
                  notes: "",
                  methodology: "",
                  findings: "",
                  limitations: "",
                  collection: "",
                })
              }
            >
              <Plus size={16} />
              Add source manually
            </Button>
          </div>
          {editing && (
            <section className="panel">
              <h2>
                {editing._id
                  ? "Edit literature notes"
                  : "Add a verified source"}
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const body = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );
                  const result = await run(
                    () =>
                      api(editing._id ? `/papers/${editing._id}` : "/papers", {
                        method: editing._id ? "PATCH" : "POST",
                        body,
                      }),
                    "Literature record saved.",
                  );
                  if (result) {
                    setEditing(null);
                    reload();
                  }
                }}
              >
                <div className="form-grid">
                  {["title", "authors", "collection", "methodology"].map(
                    (k) => (
                      <Field
                        key={k}
                        label={label(k)}
                        name={k}
                        defaultValue={editing[k]}
                        required={k === "title"}
                      />
                    ),
                  )}
                </div>
                {["notes", "findings", "limitations"].map((k) => (
                  <Field key={k} label={label(k)}>
                    <textarea name={k} defaultValue={editing[k]} rows={3} />
                  </Field>
                ))}
                <div className="row">
                  <Button disabled={busy}>Save notes</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </section>
          )}
          {tab === "Literature matrix" ? (
            <div className="panel table-panel">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Methodology</th>
                      <th>Findings</th>
                      <th>Limitations / evidence gaps</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {papers
                      ?.filter((p) =>
                        p.title.toLowerCase().includes(q.toLowerCase()),
                      )
                      .map((p) => (
                        <tr key={p._id}>
                          <td>
                            <b>{p.title}</b>
                            <small>{p.authors}</small>
                            {p.synthetic && <Demo />}
                          </td>
                          <td>{p.methodology || "Not recorded"}</td>
                          <td>{p.findings || "Not recorded"}</td>
                          <td>{p.limitations || "Not recorded"}</td>
                          <td>
                            <Button
                              variant="secondary small"
                              onClick={() => setEditing(p)}
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="cards-grid">
              {papers
                ?.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
                .map((p) => (
                  <article className="panel paper-card" key={p._id}>
                    <div className="row spread">
                      <Badge>{p.collection || p.source}</Badge>
                      <small>{p.year}</small>
                    </div>
                    <h3>{p.title}</h3>
                    <p className="muted">{p.authors}</p>
                    <p>
                      {p.notes ||
                        p.abstract?.slice(0, 200) ||
                        "Add your reading notes and evidence summary."}
                    </p>
                    {p.synthetic && <Demo />}
                    <div className="paper-actions">
                      <Button
                        variant="secondary small"
                        onClick={() => setEditing(p)}
                      >
                        Notes & evidence
                      </Button>
                      <a
                        title="Download BibTeX"
                        href={`/api/papers/${p._id}/citation`}
                      >
                        <Download size={17} />
                      </a>
                      <button
                        className="icon-button"
                        title="Remove paper"
                        onClick={async () => {
                          if (
                            window.confirm("Remove this paper and its notes?")
                          ) {
                            const r = await run(() =>
                              api(`/papers/${p._id}`, { method: "DELETE" }),
                            );
                            if (r) reload();
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
          {!papers?.length && (
            <Empty
              title="Your library is ready for its first source"
              text="Discover papers or add verified metadata manually."
            />
          )}
        </Load>
      )}
    </>
  );
}
const templates = {
  paper:
    "Abstract\n\nIntroduction\n\nMethods\n\nResults\n\nDiscussion\n\nLimitations\n\nDeclarations\n\nReferences\n",
  abstract:
    "Background\n\nObjective\n\nMethods\n\nResults (verified findings only)\n\nConclusion\n",
  proposal:
    "Research question\n\nBackground and evidence\n\nObjectives\n\nProposed methodology\n\nEthics\n\nTimeline and resources\n\nReferences\n",
  presentation:
    "Slide 1: Research question\n\nSlide 2: Context and evidence\n\nSlide 3: Methods\n\nSlide 4: Results\n\nSlide 5: Limitations and next steps\n",
  poster:
    "Title and authors\n\nResearch question\n\nMethodology\n\nKey findings\n\nLimitations\n\nReferences\n",
  questionnaire:
    "Purpose and consent\n\nEligibility\n\nQuestion 1\nResponse options\n\nQuestion 2\nResponse options\n\nClosing information\n",
};
export function Studio() {
  const { data: docs, error, reload } = useLoad("/documents");
  const [doc, setDoc] = useState(null),
    [saved, setSaved] = useState(true);
  const { run, busy } = useAction();
  const open = async (id) => {
    if (!saved && !window.confirm("Discard your unsaved edits?")) return;
    const d = await run(() => api(`/documents/${id}`));
    if (d) {
      setDoc(d);
      setSaved(true);
    }
  };
  return (
    <>
      <Heading
        eyebrow="A CLEARER SPACE TO WRITE"
        title="Research writing studio"
        description="Shape a paper, proposal, abstract, or presentation outline. Save drafts and export a DOCX."
      />
      <div className="studio-layout">
        <Section title="Your drafts">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!saved && !window.confirm("Discard your unsaved edits?"))
                return;
              const f = Object.fromEntries(new FormData(e.currentTarget));
              const d = await run(
                () =>
                  api("/documents", {
                    method: "POST",
                    body: { ...f, content: templates[f.type] },
                  }),
                "Draft created.",
              );
              if (d) {
                setDoc(d);
                setSaved(true);
                reload();
              }
            }}
          >
            <Field label="Document title" name="title" required />
            <Field label="Format">
              <select name="type">
                {Object.keys(templates).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Button disabled={busy}>
              <Plus size={16} />
              Create draft
            </Button>
          </form>
          <Load data={docs} error={error}>
            {docs?.map((d) => (
              <button
                className={`draft-item ${doc?._id === d._id ? "active" : ""}`}
                key={d._id}
                onClick={() => open(d._id)}
              >
                <FileText size={18} />
                <span>
                  <b>{d.title}</b>
                  <small>
                    {label(d.type)} · {dateLabel(d.updatedAt)}
                  </small>
                </span>
              </button>
            ))}
          </Load>
        </Section>
        <section className="panel writing-canvas">
          {doc ? (
            <>
              <div className="row spread">
                <Badge>{label(doc.type)}</Badge>
                <span className="muted">
                  {saved ? "All changes saved" : "Unsaved changes"}
                </span>
              </div>
              <input
                className="document-title"
                aria-label="Document title"
                value={doc.title}
                onChange={(e) => {
                  setDoc({ ...doc, title: e.target.value });
                  setSaved(false);
                }}
              />
              <textarea
                aria-label="Document content"
                value={doc.content}
                onChange={(e) => {
                  setDoc({ ...doc, content: e.target.value });
                  setSaved(false);
                }}
              />
              <div className="row">
                <Button
                  disabled={busy}
                  onClick={async () => {
                    const d = await run(
                      () =>
                        api(`/documents/${doc._id}`, {
                          method: "PATCH",
                          body: { title: doc.title, content: doc.content },
                        }),
                      "Draft saved.",
                    );
                    if (d) {
                      setSaved(true);
                      reload();
                    }
                  }}
                >
                  <Save size={16} />
                  Save draft
                </Button>
                {saved && (
                  <a
                    className="btn secondary"
                    href={`/api/documents/${doc._id}/export`}
                  >
                    <Download size={16} />
                    Export DOCX
                  </a>
                )}
                <Link className="text-link" to="/ai">
                  Open writing assistant
                  <ArrowUpRight size={15} />
                </Link>
              </div>
              <button
                className="danger-link"
                onClick={async () => {
                  if (window.confirm("Delete this draft?")) {
                    const r = await run(() =>
                      api(`/documents/${doc._id}`, { method: "DELETE" }),
                    );
                    if (r) {
                      setDoc(null);
                      setSaved(true);
                      reload();
                    }
                  }
                }}
              >
                Delete draft
              </button>
            </>
          ) : (
            <Empty
              title="Make room for your ideas"
              text="Create a new draft or open an existing document."
            />
          )}
        </section>
      </div>
    </>
  );
}
export function Collaboration() {
  const { data, error } = useLoad("/researchers");
  const [q, setQ] = useState("");
  return (
    <>
      <Heading
        eyebrow="KNOWLEDGE GROWS TOGETHER"
        title="Find your research community"
        description="Explore researcher profiles. Add registered collaborators by email from your project workspace."
      />
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search researchers or interests"
        />
        <Link className="btn secondary" to="/projects">
          Manage project teams
          <ArrowUpRight size={16} />
        </Link>
        <Link className="btn secondary" to="/author-sources?kind=researchers">Institutional researcher profiles</Link>
      </div>
      <Load data={data} error={error}>
        <div className="cards-grid">
          {data
            ?.filter((u) =>
              `${u.name} ${u.interests}`
                .toLowerCase()
                .includes(q.toLowerCase()),
            )
            .map((u) => (
              <article className="panel researcher-card" key={u._id}>
                <div className="avatar large">{u.name[0]}</div>
                <h3>{u.name}</h3>
                <p>{u.affiliation || "Independent researcher"}</p>
                <Badge>{label(u.roles[0])}</Badge>
                <p>{u.interests}</p>
                <p>{u.bio}</p>
                {u.demo && <Demo />}
              </article>
            ))}
        </div>
      </Load>
    </>
  );
}
