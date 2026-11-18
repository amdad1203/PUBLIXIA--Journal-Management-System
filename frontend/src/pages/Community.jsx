import ServiceHealth from './ServiceHealth';
import AdminUsers from './AdminUsers';
import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowUpRight,
  GraduationCap,
  Clock,
  CalendarDays,
  MapPin,
  Bookmark,
  Check,
  Bell,
  Mail,
  Settings as SettingsIcon,
  ShieldCheck,
  ExternalLink,
  Send,
  Plus,
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
export function Academy() {
  const { user } = useApp();
  const { data: courses, error } = useLoad("/courses");
  const { data: enrollments } = useLoad(user ? "/enrollments" : null);
  const [q, setQ] = useState("");
  return (
    <>
      <Heading
        eyebrow="KEEP YOUR CURIOSITY GROWING"
        title="The research academy"
        description="Practical knowledge for every chapter of your research journey."
      />
      <div className="academy-banner">
        <div>
          <Badge tone="pink">LEARNING, WITH PURPOSE</Badge>
          <h2>
            Your next skill.
            <br />
            Your next step forward.
          </h2>
          <p>
            Short readings, practical exercises, and knowledge checks.
            <br />
            Build confidence one lesson at a time.
          </p>
        </div>
        <div className="academy-art">
          <GraduationCap size={100} strokeWidth={1} />
          <span>QUESTION → EXPLORE → UNDERSTAND</span>
        </div>
      </div>
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Find a learning pathway"
        />
        <span className="muted">{courses?.length || 0} pathways</span>
      </div>
      <Load data={courses} error={error}>
        <div className="cards-grid">
          {courses
            ?.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
            .map((c, i) => {
              const e = enrollments?.find((e) => e.course._id === c._id);
              return (
                <Link
                  className="course-card"
                  to={`/academy/${c._id}`}
                  key={c._id}
                >
                  <div className={`course-art tone-${i % 3}`}>
                    <BookOpen size={38} strokeWidth={1.3} />
                    <span>{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="card-body">
                    <div className="row spread">
                      <Badge>{c.level}</Badge>
                      <small>{c.lessons.length} lessons</small>
                    </div>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                    {e ? (
                      <>
                        <Progress
                          value={(e.completed.length / c.lessons.length) * 100}
                        />
                        <small>{e.completed.length} lessons completed</small>
                      </>
                    ) : (
                      <div className="row spread">
                        <small>
                          <Clock size={14} />
                          {c.duration}
                        </small>
                        <ArrowUpRight size={18} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
        </div>
      </Load>
    </>
  );
}
export function Course() {
  const { id } = useParams();
  const { user } = useApp();
  const navigate = useNavigate();
  const { data: courses, error } = useLoad("/courses");
  const { data: enrollments, reload } = useLoad(user ? "/enrollments" : null);
  const { run, busy } = useAction();
  const [lesson, setLesson] = useState(0),
    [result, setResult] = useState(null);
  const c = courses?.find((c) => c._id === id);
  const en = enrollments?.find((e) => e.course._id === id);
  return (
    <Load data={courses} error={error}>
      {c && (
        <>
          <Heading
            eyebrow={`${c.level} / ${c.lessons.length} LESSONS`}
            title={c.title}
            description={c.description}
            action={
              !en ? (
                <Button
                  disabled={busy}
                  onClick={async () => {
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    const e = await run(
                      () => api(`/courses/${id}/enroll`, { method: "POST" }),
                      "You are enrolled.",
                    );
                    if (e) reload();
                  }}
                >
                  Enroll in this pathway
                  <Plus size={17} />
                </Button>
              ) : (
                <Badge tone="green">
                  {en.completed.length}/{c.lessons.length} completed
                </Badge>
              )
            }
          />
          <div className="course-layout">
            <aside className="panel lesson-nav">
              <h3>Your learning pathway</h3>
              {c.lessons.map((l, i) => (
                <button
                  key={l._id}
                  onClick={() => {
                    setLesson(i);
                    setResult(null);
                  }}
                  className={lesson === i ? "active" : ""}
                >
                  <span>
                    {en?.completed.includes(i) ? <Check size={16} /> : i + 1}
                  </span>
                  {l.title}
                </button>
              ))}
            </aside>
            <article className="panel lesson-content prose">
              <div className="eyebrow">LESSON {lesson + 1}</div>
              <h2>{c.lessons[lesson].title}</h2>
              <div className="preserve">{c.lessons[lesson].content}</div>
              <div className="exercise">
                <h3>Put it into practice</h3>
                <p>{c.lessons[lesson].exercise}</p>
              </div>
              <h3>Check your understanding</h3>
              <p>{c.lessons[lesson].quiz.question}</p>
              <form
                key={lesson}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const answer = Number(
                    new FormData(e.currentTarget).get("answer"),
                  );
                  const r = await run(() =>
                    api(`/courses/${id}/lessons/${lesson}/complete`, {
                      method: "POST",
                      body: { answer },
                    }),
                  );
                  if (r) {
                    setResult(r.correct);
                    reload();
                  }
                }}
              >
                {c.lessons[lesson].quiz.options.map((o, i) => (
                  <label className="quiz-option" key={o}>
                    <input
                      name="answer"
                      type="radio"
                      value={i}
                      required
                      disabled={!en}
                    />
                    {o}
                  </label>
                ))}
                <Button disabled={!en || busy}>
                  {en ? "Check answer" : "Enroll to take the quiz"}
                </Button>
                {result !== null && (
                  <p className={result ? "success-text" : "error-text"}>
                    {result
                      ? "Correct. This lesson is complete."
                      : "Not quite. Review the lesson and try again."}
                  </p>
                )}
              </form>
            </article>
          </div>
        </>
      )}
    </Load>
  );
}
export function Conferences() {
  const { user } = useApp();
  const navigate = useNavigate();
  const { data: events, error } = useLoad("/conferences?limit=100");
  const { data: marks, reload } = useLoad(user ? "/bookmarks" : null);
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("all"),
    [tab, setTab] = useState("Discover");
  const { run, busy } = useAction();
  const save = async (c) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const r = await run(
      () => api("/bookmarks", { method: "POST", body: { conference: c._id } }),
      "Conference saved to your tracker.",
    );
    if (r) reload();
  };
  return (
    <>
      <Heading
        eyebrow="IDEAS TRAVEL FURTHER TOGETHER"
        title="Conference hub"
        description="Explore academic events, track submissions, and keep deadlines in view."
      />
      <section className="panel">
        <h2>Conferences in Bangladesh</h2>
        <p>
          Browse current listings and follow the organizer's website for
          registration and submission details.
        </p>
        <a
          className="btn"
          href="https://www.conferencealert.com/bangladesh"
          target="_blank"
          rel="noreferrer"
        >
          Browse Conference Alert Bangladesh ↗
        </a>
      </section>
      <div className="tabs">
        {["Discover", "My conference tracker"].map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search conferences or research fields"
        />
        <select
          aria-label="Country filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All countries</option>
          <option>Bangladesh</option>
          <option>Malaysia</option>
          <option>United Kingdom</option>
        </select>
      </div>
      <Load data={events} error={error}>
        <div className="cards-grid">
          {(tab === "Discover"
            ? events
            : marks?.map((m) => ({ ...m.conference, mark: m }))
          )
            ?.filter(
              (c) =>
                `${c.title} ${c.domain}`
                  .toLowerCase()
                  .includes(q.toLowerCase()) &&
                (filter === "all" || c.country === filter),
            )
            .map((c) => {
              const mark =
                c.mark || marks?.find((m) => m.conference?._id === c._id);
              const expired = new Date(c.deadline) < new Date();
              return (
                <article className="panel conference-card" key={c._id}>
                  <div className="row spread">
                    <div className="date-tile">
                      <b>{new Date(c.date).getDate()}</b>
                      <span>
                        {new Date(c.date).toLocaleDateString(undefined, {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <Badge>{c.domain}</Badge>
                  </div>
                  <h3>{c.title}</h3>
                  <p className="row muted">
                    <MapPin size={15} />
                    {c.city}, {c.country}
                  </p>
                  <p>{c.description}</p>
                  <div className="deadline">
                    <Clock size={15} />
                    {c.deadline
                      ? `${expired ? "Deadline passed" : "Submit by"} ${dateLabel(c.deadline)}`
                      : "Submission dates: check the organizer"}
                  </div>
                  <div className="row spread">
                    <small>{c.verification}</small>
                    {c.synthetic && <Demo />}
                  </div>
                  {/^https?:\/\//.test(c.url || "") && (
                    <a
                      className="btn"
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit event website ↗
                    </a>
                  )}
                  {tab === "Discover" ? (
                    <Button
                      variant="secondary"
                      disabled={busy || !!mark}
                      onClick={() => save(c)}
                    >
                      <Bookmark size={16} />
                      {mark ? "Saved to tracker" : "Save conference"}
                    </Button>
                  ) : (
                    <>
                      <Field label="Submission status">
                        <select
                          value={mark.status}
                          disabled={busy}
                          onChange={async (e) => {
                            const r = await run(
                              () =>
                                api(`/bookmarks/${mark._id}`, {
                                  method: "PATCH",
                                  body: { status: e.target.value },
                                }),
                              "Submission status updated.",
                            );
                            if (r) reload();
                          }}
                        >
                          {[
                            "saved",
                            "preparing",
                            "submitted",
                            "accepted",
                            "rejected",
                          ].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const r = await run(
                            () =>
                              api(`/bookmarks/${mark._id}`, {
                                method: "PATCH",
                                body: {
                                  budget: Number(
                                    new FormData(e.currentTarget).get("budget"),
                                  ),
                                },
                              }),
                            "Budget saved.",
                          );
                          if (r) reload();
                        }}
                      >
                        <Field
                          label="Planned budget (your local currency)"
                          type="number"
                          name="budget"
                          min="0"
                          defaultValue={mark.budget}
                        />
                        <Button variant="secondary small" disabled={busy}>
                          Save budget
                        </Button>
                      </form>
                      <button
                        className="danger-link"
                        onClick={async () => {
                          const r = await run(() =>
                            api(`/bookmarks/${mark._id}`, { method: "DELETE" }),
                          );
                          if (r) reload();
                        }}
                      >
                        Remove bookmark
                      </button>
                    </>
                  )}
                </article>
              );
            })}
        </div>
        {tab !== "Discover" && !marks?.length && (
          <Empty
            title="Your next conference, organized"
            text="Save an event from Discover to start tracking it."
          />
        )}
      </Load>
    </>
  );
}
export function Opportunities() {
  const { user } = useApp();
  const { data: items, error } = useLoad("/opportunities");
  const { data: applications, reload } = useLoad(user ? "/applications" : null);
  const [q, setQ] = useState("");
  const { run, busy } = useAction();
  return (
    <>
      <Heading
        eyebrow="MAKE ROOM FOR WHAT’S NEXT"
        title="Research opportunities"
        description="Explore funding and research career portals. Confirm eligibility and deadlines at the source, then organize your applications."
      />
      <section className="panel">
        <h2>Official opportunity directories</h2>
        <p>
          Search current openings directly with the providers. These are
          directories, not individual vacancy listings.
        </p>
        <div className="row">
          <a
            href="https://euraxess.ec.europa.eu/jobs"
            target="_blank"
            rel="noreferrer"
          >
            EURAXESS research jobs ↗
          </a>
          <a
            href="https://www.daad-bangladesh.org/en/find-funding/scholarship-database/"
            target="_blank"
            rel="noreferrer"
          >
            DAAD scholarships ↗
          </a>
          <a
            href="https://marie-sklodowska-curie-actions.ec.europa.eu/jobs"
            target="_blank"
            rel="noreferrer"
          >
            MSCA vacancies ↗
          </a>
        </div>
      </section>
      <div className="toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Find an opportunity"
        />
      </div>
      <Load data={items} error={error}>
        <div className="cards-grid">
          {items
            ?.filter((o) => o.title.toLowerCase().includes(q.toLowerCase()))
            .map((o) => {
              const a = applications?.find((a) => a.opportunity?._id === o._id);
              return (
                <article className="panel opportunity-card" key={o._id}>
                  <div className="row spread">
                    <Badge tone="pink">{o.type}</Badge>
                    {o.synthetic && <Demo />}
                  </div>
                  <h3>{o.title}</h3>
                  <p>{o.description}</p>
                  {o.url&&<p><a href={o.url} target="_blank" rel="noreferrer">Official application information ↗</a></p>}
                  <small>{o.verification}</small>
                  <p>
                    <b>Eligibility:</b> {o.eligibility}
                  </p>
                  <div className="deadline">
                    <Clock size={15} />
                    {dateLabel(o.deadline)}
                    {o.deadline&&new Date(o.deadline)<new Date()?' · Applications closed':''}
                  </div>
                  {a ? (
                    <>
                      <Field label="Application progress">
                        <select
                          disabled={busy}
                          value={a.status}
                          onChange={async (e) => {
                            const r = await run(
                              () =>
                                api(`/applications/${a._id}`, {
                                  method: "PATCH",
                                  body: { status: e.target.value },
                                }),
                              "Application updated.",
                            );
                            if (r) reload();
                          }}
                        >
                          {[
                            "saved",
                            "preparing",
                            "submitted",
                            "successful",
                            "unsuccessful",
                          ].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                      <details>
                        <summary>Application notes</summary>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await run(
                              () =>
                                api(`/applications/${a._id}`, {
                                  method: "PATCH",
                                  body: {
                                    notes: new FormData(e.currentTarget).get(
                                      "notes",
                                    ),
                                  },
                                }),
                              "Notes saved.",
                            );
                            reload();
                          }}
                        >
                          <textarea
                            name="notes"
                            defaultValue={a.notes}
                            aria-label="Application notes"
                          />
                          <Button variant="secondary small" disabled={busy}>
                            Save notes
                          </Button>
                        </form>
                      </details>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={async () => {
                        const r = await run(
                          () =>
                            api("/applications", {
                              method: "POST",
                              body: { opportunity: o._id },
                            }),
                          "Added to your application tracker.",
                        );
                        if (r) reload();
                      }}
                    >
                      <Plus size={16} />
                      Track application
                    </Button>
                  )}
                </article>
              );
            })}
        </div>
      </Load>
    </>
  );
}
export function Notifications() {
  const { data: d, error, reload } = useLoad("/notifications?limit=100");
  const { run, busy } = useAction();
  const [filter, setFilter] = useState("all");
  const change = async (n, b) => {
    const r = await run(() =>
      api(`/notifications/${n._id}`, { method: "PATCH", body: b }),
    );
    if (r) reload();
  };
  return (
    <>
      <Heading
        eyebrow="STAY CONNECTED TO YOUR WORK"
        title="Notifications"
        description="Editorial updates, research progress, and important deadlines."
        action={
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              const r = await run(
                () => api("/notifications/read-all", { method: "POST" }),
                "All notifications marked as read.",
              );
              if (r) reload();
            }}
          >
            <Check size={17} />
            Mark all as read
          </Button>
        }
      />
      <div className="toolbar">
        <div className="tabs compact">
          {["all", "unread"].map((t) => (
            <button
              className={filter === t ? "active" : ""}
              key={t}
              onClick={() => setFilter(t)}
            >
              {label(t)}
              {t === "unread" ? ` (${d?.unread || 0})` : ""}
            </button>
          ))}
        </div>
        <span className="row muted">
          <Mail size={16} />
          {d?.emailConfigured
            ? "Email sender connected"
            : "Email sender not configured"}
        </span>
      </div>
      <Load data={d} error={error}>
        <div className="notification-list">
          {d?.items
            .filter((n) => filter !== "unread" || !n.read)
            .map((n) => (
              <details
                className={`notification-card ${n.read ? "read" : ""}`}
                key={n._id}
              >
                <summary>
                  <span className="notification-icon">
                    <Bell size={20} />
                  </span>
                  <div className="grow">
                    <h3>{n.title}</h3>
                    <small>
                      {label(n.category)} · {dateLabel(n.createdAt)}
                    </small>
                  </div>
                  {!n.read && <span className="unread-dot" />}
                  <Status value={n.email.state} />
                </summary>
                <div className="notification-body">
                  <p className="preserve">{n.body}</p>
                  <p className="muted">
                    Email:{" "}
                    {n.email.state === "sent"
                      ? "Accepted by SMTP server"
                      : label(n.email.state)}
                    {n.email.lastError ? ` · ${n.email.lastError}` : ""}
                  </p>
                  <div className="row wrap">
                    <Link
                      className="btn secondary small"
                      to={n.link}
                      onClick={() => change(n, { read: true })}
                    >
                      Open related work
                      <ArrowUpRight size={15} />
                    </Link>
                    <button
                      className="text-button"
                      onClick={() => change(n, { read: !n.read })}
                    >
                      {n.read ? "Mark unread" : "Mark read"}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => change(n, { archived: true })}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </details>
            ))}
          {!d?.items.length && (
            <Empty
              title="You’re all caught up"
              text="Updates from across your workspace will appear here."
            />
          )}
        </div>
      </Load>
    </>
  );
}
export function Settings() {
  const { user, setUser } = useApp();
  const { run, busy } = useAction();
  return (
    <>
      <Heading
        eyebrow="MAKE THIS WORKSPACE YOURS"
        title="Profile & preferences"
        description="Keep your academic profile current and choose how you hear from Publixia."
        action={<div className="compact-actions"><Link className="btn secondary" to="/notifications">Notifications</Link><Link className="btn secondary" to="/activity">Activity history</Link></div>}
      />
      <div className="two-columns">
        <Section title="Your academic profile">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const b = Object.fromEntries(new FormData(e.currentTarget));
              if(b.reviewerAvailable!==undefined)b.reviewerAvailable=b.reviewerAvailable==='true';
              if(b.reviewerCapacity)b.reviewerCapacity=Number(b.reviewerCapacity);
              const r = await run(
                () => api("/auth/me", { method: "PATCH", body: b }),
                "Profile updated.",
              );
              if (r) setUser(r.user);
            }}
          >
            <Field
              label="Full name"
              name="name"
              defaultValue={user.name}
              required
            />
            <Field
              label="University / organization"
              name="affiliation"
              defaultValue={user.affiliation}
            />
            <Field
              label="Research interests"
              name="interests"
              defaultValue={user.interests}
            />
            <Field label="About your research">
              <textarea name="bio" defaultValue={user.bio} rows={5} />
            </Field>
            {user.roles.includes('reviewer')&&<><Field label="Review availability"><select name="reviewerAvailable" defaultValue={String(user.reviewerAvailable!==false)}><option value="true">Available for invitations</option><option value="false">Unavailable for new invitations</option></select></Field><Field label="Preferred maximum active assignments" name="reviewerCapacity" type="number" min="1" max="20" defaultValue={user.reviewerCapacity||3}/><div className="review-guidance"><b>Review guidelines</b><p>Declare conflicts before accepting. Keep manuscripts confidential. Assess originality, methods, results and clarity. Give specific, constructive feedback, flag ethics concerns to the Editor and request a deadline extension when needed. Your recommendation is advisory.</p></div></>}
            <Field label="Academic status"><select name="academicStatus" defaultValue={user.academicStatus||'independent_researcher'}>{['undergraduate','postgraduate','independent_researcher','faculty','academic_author','other'].map(s=><option key={s} value={s}>{label(s)}</option>)}</select></Field>
            <Button disabled={busy}>Save profile</Button>
          </form>
        </Section>
        <div>
          <Section title="Email notifications">
            <p>{user.email}</p>
            <Status value={user.emailVerified ? "verified" : "unverified"} />
            <p>
              {user.roles.includes('publisher')?'Receive accepted manuscript handoffs, production updates, proof responses, correction requests, publication updates and journal assignments.':'Receive updates relevant to your manuscripts, assignments, projects and account.'}
            </p>
            <label className="check-label">
              <input
                type="checkbox"
                checked={user.emailNotifications}
                onChange={async (e) => {
                  const r = await run(
                    () =>
                      api("/auth/me", {
                        method: "PATCH",
                        body: { emailNotifications: e.target.checked },
                      }),
                    "Notification preference saved.",
                  );
                  if (r) setUser(r.user);
                }}
              />
              Send my notifications by email
            </label>
            {!user.emailVerified && (
              <Button
                disabled={busy}
                onClick={() =>
                  run(
                    () => api("/auth/resend-verification", { method: "POST" }),
                    "Verification email queued.",
                  )
                }
              >
                <Mail size={16} />
                Send verification email
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                run(
                  () => api("/notifications/test-email", { method: "POST" }),
                  "Test email queued. Check delivery status in Notifications.",
                )
              }
            >
              <Send size={16} />
              Send a test notification
            </Button>
            <p className="muted">
              Account verification and password reset emails are sent regardless
              of notification preferences. Practice accounts never send email.
            </p>
          </Section>
          <div className="info-note">
            <ShieldCheck size={23} />
            <p>
              AI and database credentials stay on the server. Unpublished
              manuscripts are protected by account and role permissions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
export function Admin({initialTab='Overview'}) {
  const { user } = useApp();
  const { data: d, error, reload } = useLoad("/admin/overview");
  const { data: users, setData: setUsers } = useLoad("/admin/users");
  const { data: email, reload: reloadEmail } = useLoad("/admin/email");
  const { run, busy } = useAction();
  const [tab, setTab] = useState(initialTab);
  React.useEffect(()=>setTab(initialTab),[initialTab]);
  if (!user.roles.includes("admin"))
    return (
      <Empty
        title="Administrator access required"
        text="Your account does not have access to platform administration."
      />
    );
  return (
    <>
      <Heading
        eyebrow="PLATFORM ADMINISTRATION"
        title="Keep the ecosystem running"
        description="Review real activity, account permissions, and integration delivery status."
        action={<div className="compact-actions"><Link className="btn secondary" to="/activity">Audit records</Link><Link className="btn secondary" to="/admin/criteria">AI criteria & imports</Link></div>}
      />
      <div className="tabs">
        {["Overview", "Users & roles", "Email delivery", "Announcements"].map(
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
      <Load data={d} error={error}>
        {d && (
          <>
            {tab === "Overview" && (
              <>
                <div className="stats-grid">
                  {Object.entries(d.counts).map(([k, v]) => (
                    <div className="stat-card" key={k}>
                      <small>{label(k)}</small>
                      <strong className="stat-number">{v}</strong>
                    </div>
                  ))}
                </div>
                <div className="two-columns">
                  <Section title="Connected services">
                    <ServiceHealth/>
                  </Section>
                  <Section title="AI usage">
                    {d.aiUsage.map((u) => (
                      <div className="list-row" key={String(u._id)}>
                        <b className="grow">
                          {u._id ? "Successful" : "Failed"} requests
                        </b>
                        <span>
                          {u.requests} · {u.tokens} tokens
                        </span>
                      </div>
                    ))}
                    {!d.aiUsage.length && <p>No AI requests recorded yet.</p>}
                  </Section>
                </div>
                <Section title="Recent audit activity">
                  {d.audit.map((a) => (
                    <div className="list-row" key={a._id}>
                      <ShieldCheck size={18} />
                      <div className="grow">
                        <b>{a.action}</b>
                        <small>{a.actor?.name || "System"}</small>
                      </div>
                      <small>{dateLabel(a.createdAt)}</small>
                    </div>
                  ))}
                </Section>
              </>
            )}
            {tab === "Users & roles" && <AdminUsers/>}
            {tab === "Email delivery" && (
              <>
                <div className="stats-grid">
                  {d.outbox.map((o) => (
                    <div className="stat-card" key={o._id}>
                      <Status value={o._id} />
                      <strong className="stat-number">{o.count}</strong>
                    </div>
                  ))}
                </div>
                <Section title="Recent email jobs">
                  {email?.map((n) => (
                    <div className="list-row" key={n._id}>
                      <Mail size={18} />
                      <div className="grow">
                        <b>{n.title}</b>
                        <small>
                          {n.user?.email} · Attempts: {n.email.attempts}
                        </small>
                        {n.email.lastError && (
                          <small>{n.email.lastError}</small>
                        )}
                      </div>
                      <Status value={n.email.state} />
                      {n.email.state === "failed" && (
                        <Button
                          variant="secondary small"
                          disabled={busy}
                          onClick={async () => {
                            const r = await run(
                              () =>
                                api(`/admin/notifications/${n._id}/retry`, {
                                  method: "POST",
                                }),
                              "Delivery requeued.",
                            );
                            if (r) {
                              reloadEmail();
                              reload();
                            }
                          }}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  ))}
                </Section>
              </>
            )}
            {tab === "Announcements" && (
              <Section title="Send a platform announcement">
                <p>
                  This creates an in-app notification for every active account
                  and queues email according to recipient preferences.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      !window.confirm(
                        "Send this announcement to every active user?",
                      )
                    )
                      return;
                    const b = Object.fromEntries(new FormData(e.currentTarget));
              if(b.reviewerAvailable!==undefined)b.reviewerAvailable=b.reviewerAvailable==='true';
              if(b.reviewerCapacity)b.reviewerCapacity=Number(b.reviewerCapacity);
                    await run(
                      () =>
                        api("/admin/announcements", {
                          method: "POST",
                          body: b,
                        }),
                      "Announcement queued.",
                    );
                    reload();
                  }}
                >
                  <Field
                    label="Announcement title"
                    name="title"
                    required
                    maxLength={200}
                  />
                  <Field label="Message">
                    <textarea name="body" required rows={6} />
                  </Field>
                  <Button disabled={busy}>
                    <Send size={16} />
                    Publish announcement
                  </Button>
                </form>
              </Section>
            )}
          </>
        )}
      </Load>
    </>
  );
}
