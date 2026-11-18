import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Logo, Field, Button } from "../components";
import { useApp, useAction } from "../context";
import { api } from "../api";
export default function Auth() {
  const { pathname, search } = useLocation();
  const mode = pathname.slice(1);
  const nav = useNavigate();
  const { setUser } = useApp();
  const { run, busy } = useAction();
  const [message, setMessage] = useState("");
  const [demo, setDemo] = useState("researcher");
  const titles = {
    login: "Welcome back.",
    register: "A new chapter starts here.",
    "forgot-password": "Let’s get you back in.",
    "reset-password": "Choose a new password.",
    "verify-email": "Verify your email.",
  };
  const submit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const data = await run(() =>
      api(`/auth/${mode}`, {
        method: "POST",
        body: {
          ...body,
          ...(["reset-password", "verify-email"].includes(mode)
            ? { token: new URLSearchParams(search).get("token") }
            : {}),
        },
      }),
    );
    if (data?.user) {
      setUser(data.user);
      nav("/dashboard");
    } else if (data?.message) setMessage(data.message);
  };
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Logo light />
        <div>
          <div className="eyebrow">YOUR IDEAS BELONG HERE</div>
          <h1>
            Research is a journey.
            <br />
            <em>Make it a connected one.</em>
          </h1>
          <p>
            Bring your questions, your drafts, and your next discovery into one
            thoughtful workspace.
          </p>
          <div className="auth-quote">
            <BookOpen size={30} />
            <p>
              Research. Write.
              <br />
              Collaborate. Publish.
            </p>
          </div>
        </div>
        <small>THE PUBLIXIA RESEARCH ECOSYSTEM</small>
      </div>
      <div className="auth-form-wrap">
        <Link to="/" className="text-link">
          ← Back to Publixia
        </Link>
        <div className="auth-form">
          <h2>{titles[mode]}</h2>
          <p>
            {mode === "login"
              ? "Pick up where your curiosity left off."
              : "Connect your research, learning and publishing."}
          </p>
          {message ? (
            <div className="success-box">
              {message}
              <p>
                <Link to="/login">Back to sign in</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={submit}>
              {mode === "register" && (
                <>
                  <Field
                    label="Full name"
                    name="name"
                    required
                    maxLength={100}
                  />
                  <Field
                    label="University or organization"
                    name="affiliation"
                    maxLength={200}
                  />
                  <Field label="Academic status"><select name="academicStatus" defaultValue="independent_researcher"><option value="undergraduate">Undergraduate student</option><option value="postgraduate">Postgraduate student</option><option value="independent_researcher">Independent researcher</option><option value="faculty">Faculty member</option><option value="academic_author">Academic author</option><option value="other">Other</option></select></Field>
                </>
              )}
              {["login", "register", "forgot-password"].includes(mode) && (
                <Field
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              )}
              {["login", "register", "reset-password"].includes(mode) && (
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={mode === "login" ? 1 : 10}
                  maxLength={128}
                  required
                />
              )}
              {mode === "login" && (
                <Link className="forgot" to="/forgot-password">
                  Forgot your password?
                </Link>
              )}
              <Button disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : mode === "register"
                      ? "Create your account"
                      : mode === "verify-email"
                        ? "Verify email"
                        : "Continue"}
                <ArrowUpRight size={17} />
              </Button>
            </form>
          )}
          {mode === "login" && (
            <>
              <p className="auth-switch">
                New to Publixia? <Link to="/register">Create an account</Link>
              </p>
              <div className="demo-signin">
                <b>Explore role workspaces</b>
                <p>
                  Use the {demo} account credentials in your private setup guide.
                </p>
                <select
                  aria-label="Workspace role"
                  value={demo}
                  onChange={(e) => setDemo(e.target.value)}
                >
                  {[
                    "researcher",

                    "reviewer",
                    "editor",
                    "publisher",


                    "admin",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {mode === "register" && (
            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
