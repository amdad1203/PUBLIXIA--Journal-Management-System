import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Provider, useApp } from "./context";
import { Shell, PublicHeader } from "./components";
import Home from "./pages/Home";
import {JournalManagement,Activity} from './pages/Governance';
import {StructuredStudio,ResearchPlan,AuthorHandbook,AuthorCatalog} from './pages/AuthorWorkspace';
import {
  Discovery,
  ResearchGuide,
  ToolHub,
  CriteriaAdmin,
} from "./pages/Intelligence";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import {ReviewQueue,EditorialAssignments} from './pages/Workflow';
import EditorOperations from './pages/EditorOperations';
import {
  Journals,
  JournalDetail,
  Article,
  Manuscripts,
  ManuscriptDetail,
} from "./pages/Publishing";
import {
  Projects,
  ProjectDetail,
  Research,
  Studio,
  Collaboration,
} from "./pages/Research";
import { AILab, ScreeningList, ScreeningDetail } from "./pages/AI";
import {
  Academy,
  Course,
  Conferences,
  Opportunities,
  Notifications,
  Settings,
  Admin,
} from "./pages/Community";
import "./styles.css";
function Protected() {
  const { user, ready } = useApp();
  if (!ready) return <div className="app-loading">Opening your workspace…</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
function PublicWorkspace() {
  const { user, ready } = useApp();
  if (!ready) return <div className="app-loading">Opening Publixia…</div>;
  return user ? (
    <Shell />
  ) : (
    <>
      <PublicHeader />
      <main className="public-content">
        <Outlet />
      </main>
    </>
  );
}
function ScrollTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>This page could not be displayed.</h1>
        <p>Your saved work is safe. Reload to try again.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Provider>
          <ScrollTop />
          <Routes>
            <Route path="/" element={<Home />} />
            {[
              "login",
              "register",
              "forgot-password",
              "reset-password",
              "verify-email",
            ].map((p) => (
              <Route key={p} path={`/${p}`} element={<Auth />} />
            ))}
            <Route element={<PublicWorkspace />}>
              <Route path="/author-sources" element={<AuthorCatalog/>}/>
              <Route path="/author-handbook" element={<AuthorHandbook/>}/>
              <Route path="/discover" element={<Discovery />} />
              <Route path="/guide" element={<ResearchGuide />} />
              <Route path="/tools" element={<ToolHub />} />
              <Route path="/journals" element={<Journals />} />
              <Route path="/journals/:id" element={<JournalDetail />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/academy/:id" element={<Course />} />
              <Route path="/conferences" element={<Conferences />} />
              <Route path="/opportunities" element={<Opportunities />} />
            </Route>
            <Route element={<Protected />}>
              <Route element={<Shell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/reviews" element={<ReviewQueue/>}/>
                <Route path="/reviews/invitations" element={<ReviewQueue view="invitations"/>}/>
                <Route path="/reviews/history" element={<ReviewQueue view="history"/>}/>
                <Route path="/editorial/submissions" element={<EditorOperations/>}/>
                <Route path="/editorial/assignments" element={<EditorialAssignments/>}/>
                <Route path="/editorial/decisions" element={<EditorOperations decisions/>}/>
                <Route path="/production" element={<Manuscripts queue="production"/>}/>
                <Route path="/production/proofs" element={<Manuscripts queue="proofs"/>}/>
                <Route path="/production/published" element={<Manuscripts queue="published"/>}/>
                <Route path="/admin/users" element={<Admin initialTab="Users & roles"/>}/>
                <Route path="/admin/system" element={<Admin initialTab="Overview"/>}/>
                <Route path="/journal-management" element={<JournalManagement/>}/>
                <Route path="/activity" element={<Activity/>}/>
                <Route path="/manuscripts" element={<Manuscripts />} />
                <Route path="/manuscripts/:id" element={<ManuscriptDetail />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/research" element={<Research />} />
                <Route path="/ai" element={<AILab />} />
                <Route path="/screening" element={<ScreeningList />} />
                <Route path="/screening/:id" element={<ScreeningDetail />} />
                <Route path="/collaboration" element={<Collaboration />} />
                <Route path="/studio" element={<StructuredStudio />} />
                <Route path="/studio/legacy" element={<Studio />} />
                <Route path="/plan" element={<ResearchPlan />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/criteria" element={<CriteriaAdmin />} />
              </Route>
            </Route>
            <Route path="/articles/:id" element={<Article />} />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>Page not found</h1>
                  <a href="/">Return to Publixia</a>
                </div>
              }
            />
          </Routes>
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
const reactRoot =
  import.meta.hot?.data.reactRoot ||
  createRoot(document.getElementById("root"));
if (import.meta.hot) import.meta.hot.data.reactRoot = reactRoot;
reactRoot.render(<App />);
