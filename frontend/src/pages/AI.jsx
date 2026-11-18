import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Plus,
  Send,
  Trash2,
  Copy,
  Download,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  ArrowUpRight,
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
  Empty,
} from "../components";
const assistantNames = {
  ethics: 'Research ethics and integrity',
  mentor: "Research mentor",
  writing: "Academic writing",
  literature: "Literature review",
  methodology: "Research methodology",
  citation: "Citations & references",
  proposal: "Research proposal",
  coding: "Research coding",
  conference: "Conference planning",
  planner: "Research planning",
};
export function AILab() {
  const {data:papers}=useLoad('/papers?limit=100');
  const [sourceIds,setSourceIds]=useState([]);
  const {data:assistantGuidance}=useLoad('/ai/assistants');
  const { data: chats, error, reload } = useLoad("/ai/conversations?limit=100");
  const [chat, setChat] = useState(null),
    [assistant, setAssistant] = useState("mentor"),
    [message, setMessage] = useState(""),
    [context, setContext] = useState(false);
  const { run, busy } = useAction();
  const { notify } = useApp();
  const bottom = useRef(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat?.messages.length, busy]);
  const newChat = async () => {
    const c = await run(() =>
      api("/ai/conversations", { method: "POST", body: { assistant } }),
    );
    if (c) {
      setChat(c);
      reload();
    }
    return c;
  };
  const send = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const c = chat || (await newChat());
    if (!c) return;
    const r = await run(() =>
      api(`/ai/conversations/${c._id}/messages`, {
        method: "POST",
        body: { message, includeContext: context, sourceIds:context?sourceIds:[] },
      }),
    );
    if (r) {
      setChat(r);
      setMessage("");
      reload();
    }
  };
  return (
    <>
      <Heading
        eyebrow="A THOUGHTFUL SECOND PERSPECTIVE"
        title="AI research lab"
        description="Gemini-powered assistance for better questions, clearer writing, and stronger research habits."
      />
      <div className="chat-layout">
        <aside className="panel chat-sidebar">
          <Field label="Choose an assistant">
            <select
              value={assistant}
              onChange={(e) => setAssistant(e.target.value)}
              disabled={busy}
            >
              {Object.entries(assistantNames).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <details><summary>When and how to use this assistant</summary><p>{assistantGuidance?.[assistant]}</p><p>Provide your question, relevant evidence and constraints. Enable project context only when you want to share it with Gemini.</p><Link to="/author-handbook?q=Assistant">Detailed assistant guide</Link></details>
          <Button onClick={newChat} disabled={busy}>
            <Plus size={16} />
            New conversation
          </Button>
          <div className="nav-caption">YOUR CONVERSATIONS</div>
          <Load data={chats} error={error}>
            {chats?.map((c) => (
              <button
                className={`chat-item ${chat?._id === c._id ? "active" : ""}`}
                key={c._id}
                disabled={busy}
                onClick={async () => {
                  const full = await run(() =>
                    api(`/ai/conversations/${c._id}`),
                  );
                  if (full) {
                    setChat(full);
                    setAssistant(full.assistant);
                  }
                }}
              >
                <Sparkles size={16} />
                <span>
                  {c.title}
                  <small>{assistantNames[c.assistant]}</small>
                </span>
              </button>
            ))}
          </Load>
        </aside>
        <section className="chat-main panel">
          <header className="chat-header">
            <span className="sparkle-box">
              <Sparkles size={20} />
            </span>
            <div className="grow">
              <b>{assistantNames[chat?.assistant || assistant]}</b>
              <small>Powered by Gemini · your judgment stays in control</small>
            </div>
            {chat && (
              <>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={async () => {
                    const title = window.prompt(
                      "Conversation title",
                      chat.title,
                    );
                    if (title) {
                      const c = await run(() =>
                        api(`/ai/conversations/${chat._id}`, {
                          method: "PATCH",
                          body: { title },
                        }),
                      );
                      if (c) {
                        setChat(c);
                        reload();
                      }
                    }
                  }}
                >
                  Rename
                </button>
                <button
                  className="icon-button"
                  aria-label="Delete conversation"
                  disabled={busy}
                  onClick={async () => {
                    if (window.confirm("Delete this conversation?")) {
                      const r = await run(() =>
                        api(`/ai/conversations/${chat._id}`, {
                          method: "DELETE",
                        }),
                      );
                      if (r) {
                        setChat(null);
                        reload();
                      }
                    }
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </>
            )}
          </header>
          <div className="chat-messages">
            {!chat?.messages.length && (
              <div className="chat-welcome">
                <div className="ai-orb">
                  <Sparkles size={35} />
                </div>
                <h2>Where will your curiosity take you?</h2>
                <p>
                  Start with a question, a rough idea, or a paragraph you want
                  to improve.
                </p>
                <div className="prompt-grid">
                  {[
                    "Help me refine my research question",
                    "How can I structure a literature review?",
                    "Explain sampling bias with an example",
                    "Help me plan a reproducible study",
                  ].map((p) => (
                    <button key={p} onClick={() => setMessage(p)}>
                      {p}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chat?.messages.map((m, i) => (
              <div key={m._id || i} className={`chat-message ${m.role}`}>
                <span className="message-icon">
                  {m.role === "model" ? <Sparkles size={17} /> : "You"}
                </span>
                <div className="message-content">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                  {m.role === 'model' && <Button variant="secondary small" disabled={busy} onClick={async()=>{
                    const title=window.prompt('Title for a new draft containing this response','AI working notes');
                    if(!title)return;
                    await run(()=>api('/documents',{method:'POST',body:{title,type:'paper',content:m.text}}),'Response saved as a separate draft. Open Writing Studio to review and edit it.');
                  }}>Save to Writing Studio</Button>}
                  {m.role === "model" && (
                    <button
                      className="text-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(m.text);
                          notify("Response copied.");
                        } catch {
                          notify("Copy unavailable in this browser.", true);
                        }
                      }}
                    >
                      <Copy size={13} />
                      Copy response
                    </button>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="thinking">
                <Sparkles size={17} />
                Thinking through your question…
              </div>
            )}
            <div ref={bottom} />
          </div>
          <form className="chat-composer" onSubmit={send}>
            <div className="composer-input">
              <textarea
                aria-label="Message to AI assistant"
                placeholder="Ask a question. Explore an idea."
                value={message}
                maxLength={12000}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!busy) send(e);
                  }
                }}
                rows={2}
              />
              <Button
                disabled={busy || !message.trim()}
                aria-label="Send message"
              >
                <Send size={18} />
              </Button>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={context}
                onChange={(e) => setContext(e.target.checked)}
              />
              Include my project objectives and saved literature notes
            </label>
            {context&&<details><summary>Choose evidence to share ({sourceIds.length} selected)</summary><p>Choose up to 20 saved sources. With none selected, up to eight library records are included.</p>{papers?.map(p=><label className="check-label" key={p._id}><input type="checkbox" checked={sourceIds.includes(p._id)} disabled={!sourceIds.includes(p._id)&&sourceIds.length>=20} onChange={e=>setSourceIds(e.target.checked?[...sourceIds,p._id]:sourceIds.filter(id=>id!==p._id))}/>{p.title}</label>)}</details>}
            <small>
              Messages and selected context are sent to Google Gemini. Verify
              factual claims and references before use.
            </small>
          </form>
        </section>
      </div>
    </>
  );
}
export function ScreeningList() {
  const { data: reports, error } = useLoad("/ai/screening");
  const { data: manuscripts } = useLoad("/manuscripts?limit=100");
  const { run, busy } = useAction();
  const nav = useNavigate();
  const { user } = useApp();
  return (
    <>
      <Heading
        eyebrow="REFINE YOUR WORK BEFORE SUBMISSION"
        title="Manuscript pre-check"
        description="Identify language and structure issues, review suggestions, and keep your original manuscript intact."
      />
      <div className="screening-intro">
        <ShieldCheck size={35} />
        <div>
          <h2>Your research. Your decisions.</h2>
          <p>
            AI can help with clarity and completeness. It cannot certify
            originality, validate findings, or replace human peer review. Every
            correction needs your approval.
          </p>
        </div>
      </div>
      <section className="panel form-panel">
        <h2>Start a preliminary check</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = Object.fromEntries(new FormData(e.currentTarget));
            const s = await run(
              () =>
                api("/ai/screening", {
                  method: "POST",
                  body: {
                    manuscript: f.manuscript,
                    mode: f.mode,
                    consent: f.consent === "on",
                  },
                }),
              "Screening report is ready.",
            );
            if (s) nav(`/screening/${s._id}`);
          }}
        >
          <div className="form-grid">
            <Field label="Your manuscript">
              <select name="manuscript" required>
                <option value="">Choose an uploaded manuscript</option>
                {manuscripts
                  ?.filter(
                    (m) =>
                      (m.author?._id || m.author) === user.id &&
                      m.currentVersion > 0,
                  )
                  .map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.code} · {m.title}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Screening mode">
              <select name="mode">
                <option value="general">General language & structure</option>
                <option value="journal">Journal-specific guidance</option>
                <option value="final">Final pre-submission check</option>
              </select>
            </Field>
          </div>
          <label className="check-label consent">
            <input type="checkbox" name="consent" required />I authorize sending
            the manuscript text to Google Gemini for this screening and have
            permission to share it.
          </label>
          <Button disabled={busy}>
            <Sparkles size={17} />
            {busy ? "Screening your manuscript…" : "Start pre-check"}
          </Button>
        </form>
      </section>
      <Load data={reports} error={error}>
        <Section title="Your screening reports">
          {reports?.map((s) => (
            <Link key={s._id} to={`/screening/${s._id}`} className="list-row">
              <ShieldCheck size={23} />
              <div className="grow">
                <h3>{s.manuscript?.title}</h3>
                <small>
                  {label(s.mode)} · {dateLabel(s.createdAt)}
                </small>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
          {!reports?.length && (
            <Empty
              title="A second look can make a difference"
              text="Your completed pre-check reports will appear here."
            />
          )}
        </Section>
      </Load>
    </>
  );
}
export function ScreeningDetail() {
  const { id } = useParams();
  const { data: d, error, reload } = useLoad(`/ai/screening/${id}`);
  const { run, busy } = useAction();
  const [filter, setFilter] = useState("all");
  const decide = async (issue, decision, replacement) => {
    const r = await run(
      () =>
        api(`/ai/screening/${id}/issues/${issue._id}`, {
          method: "PATCH",
          body: { decision, ...(replacement ? { replacement } : {}) },
        }),
      "Correction decision saved.",
    );
    if (r) reload();
  };
  return (
    <Load data={d} error={error}>
      {d && (
        <>
          <Heading
            eyebrow="PRELIMINARY AI REPORT"
            title={d.manuscript.title}
            description={`Version ${d.version.number} · ${label(d.mode)} check · ${d.model}`}
            action={
              <div className="row">
                <a
                  href={`/api/ai/screening/${id}/export?format=pdf`}
                  className="btn secondary"
                >
                  <Download size={16} />
                  Report PDF
                </a>
                <a href={`/api/ai/screening/${id}/export`} className="btn">
                  <Download size={16} />
                  Corrected DOCX
                </a>
              </div>
            }
          />
          <section className="panel prose">
            <h2>Screening summary</h2>
            {d.criteriaSnapshot && (
              <details>
                <summary>Authority criteria used for this report</summary>
                <p>
                  {d.criteriaSnapshot.name} ·{" "}
                  {d.criteriaSnapshot.domain || "general"} · Version{" "}
                  {d.criteriaSnapshot._id || "default"}
                </p>
                <p>{d.criteriaSnapshot.instructions}</p>
              </details>
            )}
            <p>{d.summary}</p>
            <div className="row">
              <Badge>{d.issues.length} suggestions</Badge>
              <Badge tone="green">
                {d.issues.filter((i) => i.decision === "accepted").length}{" "}
                accepted
              </Badge>
            </div>
            <p className="muted">
              The export applies only accepted corrections. Original formatting
              may change in the text-based DOCX export; the original upload
              remains available.
            </p>
          </section>
          <div className="toolbar">
            <select
              aria-label="Filter correction decisions"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["all", "pending", "accepted", "rejected"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="correction-layout">
            <section className="panel original-text">
              <h2>Original manuscript</h2>
              <pre className="document-preview">{d.version.text}</pre>
            </section>
            <div>
              {d.issues
                .filter((i) => filter === "all" || i.decision === filter)
                .map((i) => (
                  <article className="panel correction-card" key={i._id}>
                    <div className="row spread">
                      <Badge>{i.category}</Badge>
                      <Status value={i.decision} />
                    </div>
                    <div className="before">
                      <small>ORIGINAL</small>
                      <p>{i.original}</p>
                    </div>
                    <div className="after">
                      <small>SUGGESTED</small>
                      <p>{i.replacement}</p>
                    </div>
                    <p>{i.explanation}</p>
                    <div className="row wrap">
                      <Button
                        variant="small"
                        disabled={busy}
                        onClick={() => decide(i, "accepted")}
                      >
                        <Check size={15} />
                        Accept
                      </Button>
                      <Button
                        variant="secondary small"
                        disabled={busy}
                        onClick={() => decide(i, "rejected")}
                      >
                        <X size={15} />
                        Reject
                      </Button>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => {
                          const replacement = window.prompt(
                            "Edit replacement text",
                            i.replacement,
                          );
                          if (replacement) decide(i, "accepted", replacement);
                        }}
                      >
                        Edit & accept
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Undo decision"
                        disabled={busy}
                        onClick={() => decide(i, "pending")}
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              {!d.issues.length && (
                <Empty
                  title="No precise text corrections returned"
                  text="Review the screening summary for structure and completeness advice."
                />
              )}
            </div>
          </div>
        </>
      )}
    </Load>
  );
}
