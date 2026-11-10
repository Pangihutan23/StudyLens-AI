import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  Files,
  MessageSquare,
  AlignLeft,
  ListChecks,
  History,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpRight,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useResource } from "../../hooks/useResource";

export function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-icon">
        <BookOpen size={21} strokeWidth={1.6} />
      </span>
      <span>
        AI Smart Study<span className="logo-dot">.</span>
      </span>
    </Link>
  );
}
const links = [
  ["/app", "Dashboard", LayoutDashboard],
  ["/app/documents", "My Documents", Files],
  ["/app/chat", "AI Chat Assistant", MessageSquare],
  ["/app/summaries", "AI Summarizer", AlignLeft],
  ["/app/quizzes", "Quiz Generator", ListChecks],
  ["/app/history", "Learning History", History],
];
export default function Layout() {
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false);
  const { pathname } = useLocation();
  const health = useResource("/health");
  const current = links.find(([path]) => pathname === path)?.[1] || "Settings";
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-btn mobile-only"
            onClick={() => setMobile(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">PERSONAL WORKSPACE</div>
        <nav aria-label="Main navigation">
          {links.map(([path, label, Icon]) => (
            <NavLink
              end={path === "/app"}
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              onClick={() => setMobile(false)}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={18} />
            <strong>A little progress, every day.</strong>
            <p>Your next breakthrough starts with a question.</p>
            <Link to="/app/chat">
              Start a conversation <ArrowUpRight size={14} />
            </Link>
          </div>
          <NavLink to="/app/settings" onClick={() => setMobile(false)}>
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            <span>Collapse sidebar</span>
          </button>
          <div className="local-profile">
            <span className="avatar">S</span>
            <div>
              <strong>My study space</strong>
              <small>Personal · Local workspace</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-only"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{current}</strong>
          </div>
          <div className="topbar-right">
            <span className={`connection ${health.data ? "online" : ""}`}>
              <i />
              {health.loading
                ? "Connecting"
                : health.error
                  ? "Server offline"
                  : health.data?.ai_configured
                    ? "Gemini connected"
                    : "API key needed"}
            </span>
            <Link
              className="avatar small"
              to="/app/settings"
              aria-label="Workspace settings"
            >
              S
            </Link>
          </div>
        </header>
        <main id="main" className="app-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Less overwhelm. More understanding.</span>
          <span>
            AI Smart Study <span className="blue">✦</span>
          </span>
        </footer>
      </div>
    </div>
  );
}
