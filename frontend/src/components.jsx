import React, { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  FlaskConical,
  Sparkles,
  GraduationCap,
  CalendarDays,
  FolderKanban,
  PenTool,
  Users,
  Briefcase,
  Bell,
  Settings,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Plus, Mail, ClipboardCheck, History, Inbox, Layers,
} from "lucide-react";
import { useApp, useLoad } from "./context";
import { api, label } from "./api";
import { navigation } from './navigation';
import { WORKSPACES, canVisit } from '../../shared/workspaces';
import {ActiveProject} from './pages/AuthorWorkspace';
export const Logo = ({ light = false }) => (
  <Link to="/" className={`logo ${light ? "light" : ""}`}>
    <span className="logo-mark">
      P<span>•</span>
    </span>
    <span>
      PUBLIXIA<small>THE RESEARCH ECOSYSTEM</small>
    </span>
  </Link>
);
export function Button({ children, variant = "", ...props }) {
  return (
    <button className={`btn ${variant}`} {...props}>
      {children}
    </button>
  );
}
export const Badge = ({ children, tone = "" }) => (
  <span className={`badge ${tone}`}>{children}</span>
);
export const Status = ({ value }) => (
  <Badge
    tone={
      ["done", "accepted", "published", "sent", "completed"].includes(value)
        ? "green"
        : ["rejected", "failed"].includes(value)
          ? "red"
          : ""
    }
  >
    {label(value)}
  </Badge>
);
export const Demo = () => null;
export function Heading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export const Field = ({ label: caption, children, ...props }) => (
  <label className="field">
    <span>{caption}</span>
    {children || <input {...props} />}
  </label>
);
export function Empty({
  title = "Nothing here yet",
  text = "Your saved work will appear here.",
  children,
}) {
  return (
    <div className="empty">
      <FolderKanban size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function Load({ data, error, children }) {
  if (error)
    return (
      <div className="error-box" role="alert">
        {error}
      </div>
    );
  if (data === null)
    return (
      <div className="loading" aria-label="Loading">
        <div />
        <div />
        <div />
      </div>
    );
  return children;
}
export const Section = ({ title, link, children }) => (
  <section className="panel">
    <div className="section-heading">
      <h2>{title}</h2>
      {link && (
        <Link to={link}>
          View all <ChevronRight size={15} />
        </Link>
      )}
    </div>
    {children}
  </section>
);
export function SearchBox({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="search-box">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export const Progress = ({ value }) => (
  <div
    className="progress"
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <span style={{ width: `${value}%` }} />
  </div>
);
export function Shell() {
  const { user, setUser, notify, workspaceRole, setWorkspace } = useApp();
  const icons={LayoutDashboard,FolderKanban,FlaskConical,PenTool,BookOpen,FileText,Settings,Mail,ClipboardCheck,History,Inbox,Users,Layers,ShieldCheck};
  const navigationGroups=navigation[workspaceRole].map(([name,items])=>[name,items.map(([url,title,icon])=>[url,title,icons[icon]])]);
  const workspace=WORKSPACES[workspaceRole];
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const nav = useNavigate();
  const [unread, setUnread] = useState(0);
  React.useEffect(() => {
    const read = () =>
      api("/notifications?limit=1")
        .then((r) => setUnread(r.unread))
        .catch(() => {});
    read();
    const t = setInterval(read, 30000);
    return () => clearInterval(t);
  }, [location.pathname]);
  const title =
    navigationGroups
      .flatMap((g) => g[1])
      .find((n) => location.pathname.startsWith(n[0]))?.[1] || "Your workspace";
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Logo light />
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="workspace-identity">{workspace.label}<small>YOUR WORKSPACE</small></div>
        {navigationGroups.map(([name, items]) => (
          <div className="nav-group" key={name}>
            <div className="nav-caption">{name}</div>
            {items.map(([url, title, Icon]) => (
              <NavLink key={url} to={url} end onClick={() => setOpen(false)}>
                <Icon size={19} />
                <span>{title}</span>
                {url === "/ai" && <span className="tiny-new">AI</span>}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="live-dot" /> {workspace.label} workspace
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={14} /> <strong>{title}</strong>
            </span>
          </div>
          <div className="row">
            <Link className="top-link" to={workspaceRole==='researcher'?'/research':'/dashboard'}>
              <Search size={18} />
              <span>{workspaceRole==='researcher'?'Discover research':'Workspace overview'}</span>
            </Link>
            <Link
              to="/notifications"
              className="notification-button"
              aria-label={`${unread} unread notifications`}
            >
              <Bell size={20} />
              {unread > 0 && <span>{unread > 99 ? "99+" : unread}</span>}
            </Link>
            <div className="avatar">{user?.name?.slice(0, 1)}</div>
            <div className="user-info">
              <b>{user?.name}</b>
              <small>{workspace.label}</small>
            </div>
            <button
              className="icon-button"
              title="Sign out"
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  setUser(null);
                  nav("/login");
                } catch (e) {
                  notify(e.message, true);
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main id="main-content">
          {user?.roles.length>1&&<label className="workspace-switch">Authorized workspace <select value={workspaceRole} onChange={e=>{setWorkspace(e.target.value);nav('/dashboard');}}>{user.roles.filter(r=>WORKSPACES[r]).map(r=><option key={r} value={r}>{WORKSPACES[r].label}</option>)}</select></label>}
          {workspaceRole==='researcher'&&<ActiveProject/>}
          {canVisit(workspaceRole,location.pathname)?<Outlet key={workspaceRole}/>:<Empty title="This page belongs to another workspace" text="Use the destinations available to your assigned role."><Link className="btn" to="/dashboard">Open my workspace</Link></Empty>}
        </main>
        <footer className="workspace-footer">
          <span>© {new Date().getFullYear()} Publixia</span>
          <span>Research. Write. Collaborate. Publish.</span>
        </footer>
      </div>
    </div>
  );
}
export function PublicHeader() {
  return (
    <header className="public-header">
      <Logo />
      <nav>
        <Link to="/discover">Discovery</Link>
        <Link to="/guide">FAQ</Link>
        <Link to="/tools">Tools</Link>
        <Link to="/journals">Journals</Link>
        <Link to="/conferences">Conferences</Link>
        <Link to="/academy">Academy</Link>
      </nav>
      <Link to="/login" className="btn small">
        Enter workspace <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}
