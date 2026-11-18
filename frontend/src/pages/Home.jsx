import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Sparkles,
  Check,
  FileText,
  Network,
} from "lucide-react";
import { Logo, PublicHeader, Badge } from "../components";
import { useLoad } from "../context";
export default function Home() {
  const { data: stats } = useLoad("/catalog/stats");
  return (
    <div className="landing">
      <PublicHeader />
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> ONE WORKSPACE. EVERY STAGE OF
            RESEARCH.
          </div>
          <h1>
            Good research deserves
            <br />
            <em>a greater reach.</em>
          </h1>
          <p>
            From your first question to your next publication. Discover
            knowledge, develop ideas, and bring your research to the world with
            Publixia.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn">
              Start your research journey <ArrowUpRight size={18} />
            </Link>
            <Link to="/journals" className="text-link">
              Explore journals <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="mini-avatars">
              <i>AR</i>
              <i>NH</i>
              <i>FK</i>
            </span>
            <span>
              Built for curious minds.
              <br />
              <strong>Researchers, authors & academic teams.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Connected research workflow">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="research-paper">
            <div className="paper-top">
              <span>PUBLIXIA / RESEARCH NOTE</span>
              <FileText size={17} />
            </div>
            <span className="paper-tag">FROM QUESTION TO CONTRIBUTION</span>
            <h2>
              Your next
              <br />
              discovery
              <br />
              starts here.
            </h2>
            <div className="paper-rule" />
            <p>
              A clear question.
              <br />A stronger method.
              <br />A meaningful contribution.
            </p>
            <div className="paper-foot">
              <span>01 — RESEARCH IN PROGRESS</span>
              <ArrowUpRight />
            </div>
          </div>
          <div className="floating-note ai">
            <Sparkles size={22} />
            <div>
              <strong>Your AI research companion</strong>
              <small>A little clarity for your next big idea.</small>
            </div>
          </div>
          <div className="floating-note done">
            <span className="check-circle">
              <Check size={17} />
            </span>
            <div>
              <strong>Ready for the next chapter</strong>
              <small>Write. Review. Refine. Publish.</small>
            </div>
          </div>
          <div className="visual-caption">KNOWLEDGE, CONNECTED.</div>
        </div>
      </section>
      <section className="stat-band">
        <p>
          A complete ecosystem.
          <br />
          <b>Built around your work.</b>
        </p>
        {[
          ["journals", "Workspace journals"],
          ["articles", "Sample publications"],
          ["courses", "Learning pathways"],
          ["conferences", "Illustrative events"],
        ].map(([key, label]) => (
          <div key={key}>
            <strong>{stats?.[key] ?? "—"}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      <section className="pillars">
        <div className="eyebrow">MORE FOCUS. FEWER DISCONNECTED TOOLS.</div>
        <h2>Make room for the work that matters.</h2>
        <div className="pillar-grid">
          {[
            [
              FlaskConical,
              "01",
              "Research with purpose",
              "Discover papers, map the evidence, and organize your next study in a shared research workspace.",
              "/research",
              "Explore research",
            ],
            [
              BookOpen,
              "02",
              "Publish with confidence",
              "Prepare your manuscript, receive human peer review, and follow every step of publication.",
              "/manuscripts",
              "Start writing",
            ],
            [
              GraduationCap,
              "03",
              "Keep your curiosity growing",
              "Build your research skills with practical lessons, thoughtful exercises, and clear learning pathways.",
              "/academy",
              "Explore the academy",
            ],
          ].map(([Icon, n, title, description, to, cta]) => (
            <article key={n}>
              <div className="pillar-top">
                <Icon size={28} />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <Link to={to}>
                {cta}
                <ArrowUpRight size={18} />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="home-ai">
        <Sparkles size={36} />
        <div>
          <div className="eyebrow">MEET YOUR RESEARCH COMPANION</div>
          <h2>
            A thoughtful second perspective.
            <br />
            At every step.
          </h2>
          <p>
            Ask better questions, untangle a methodology, or improve a draft.
            Specialized Gemini assistants support your judgment while you stay
            in control.
          </p>
        </div>
        <Link to="/ai" className="btn pink">
          Enter the AI lab <ArrowUpRight size={18} />
        </Link>
      </section>
      <footer className="public-footer">
        <Logo />
        <span>Research. Write. Collaborate. Publish.</span>
        <p>
          Discover sourced academic research and manage your publication workflow.
        </p>
      </footer>
    </div>
  );
}
