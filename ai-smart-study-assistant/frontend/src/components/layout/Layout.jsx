import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { WorkspaceLink as Link } from "../common/WorkspaceLink";
import {
  BookOpen,
  LayoutDashboard,
  Files,
  MessageSquare,
  AlignLeft,
  ListChecks,
  History,
  Settings,
  Plus,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { LoadingSpinner } from "../common/UI";

const tools = {
  chat: {
    label: "AI Chat Assistant",
    short: "Chat",
    icon: MessageSquare,
    component: lazy(() => import("../../pages/ChatAssistant")),
  },
  summaries: {
    label: "AI Summarizer",
    short: "Summarize",
    icon: AlignLeft,
    component: lazy(() => import("../../pages/Summarizer")),
  },
  quizzes: {
    label: "Quiz Generator",
    short: "Practice",
    icon: ListChecks,
    component: lazy(() => import("../../pages/QuizGenerator")),
  },
  documents: {
    label: "My Documents",
    icon: Files,
    component: lazy(() => import("../../pages/Documents")),
  },
  dashboard: {
    label: "Dashboard",
    icon: LayoutDashboard,
    component: lazy(() => import("../../pages/Dashboard")),
  },
  history: {
    label: "Learning History",
    icon: History,
    component: lazy(() => import("../../pages/LearningHistory")),
  },
  settings: {
    label: "Workspace settings",
    icon: Settings,
    component: lazy(() => import("../../pages/Settings")),
  },
};
const modes = ["chat", "summaries", "quizzes"];

export function Logo() {
  return (
    <Link
      to="/?tool=chat"
      className="studio-logo"
      aria-label="StudyLens AI home"
    >
      <span className="studio-logo-mark">
        <BookOpen size={21} strokeWidth={1.7} />
      </span>
      <span>
        StudyLens<span className="studio-logo-ai"> AI</span>
      </span>
    </Link>
  );
}

export default function Layout() {
  const [params, setParams] = useSearchParams();
  const active = Object.hasOwn(tools, params.get("tool"))
    ? params.get("tool")
    : "chat";
  const [visited, setVisited] = useState(() => new Set([active]));
  const tabs = useRef({});
  const health = useResource("/health");
  useEffect(() => {
    setVisited((previous) =>
      previous.has(active) ? previous : new Set([...previous, active]),
    );
  }, [active]);
  useEffect(() => {
    document.title = `${tools[active].short || tools[active].label} · StudyLens AI`;
  }, [active]);
  function select(tool) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("tool", tool);
      return next;
    });
  }
  function tabKey(event, index) {
    const offsets = { ArrowRight: 1, ArrowLeft: -1 };
    let next;
    if (event.key in offsets)
      next = (index + offsets[event.key] + modes.length) % modes.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = modes.length - 1;
    else return;
    event.preventDefault();
    select(modes[next]);
    tabs.current[modes[next]]?.focus();
  }
  const connected = !!health.data && !health.error;
  return (
    <div className="study-studio">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="studio-masthead">
        <Logo />
        <span className="studio-masthead-note">
          <ShieldCheck size={14} /> Your notes. Your learning space.
        </span>
        <button
          className="studio-settings-link"
          onClick={() => select("settings")}
        >
          <Settings size={15} />
          <span>Workspace settings</span>
        </button>
      </header>
      <div className="studio-intro">
        <span className="eyebrow">
          <span /> A LITTLE CLARITY, EVERY DAY
        </span>
        <h1>
          Less searching. <em>More understanding.</em>
        </h1>
        <p>
          Your PDFs, a thoughtful conversation, and the next big idea. All in
          one place.
        </p>
      </div>
      <div className="studio-frame">
        <nav className="studio-rail" aria-label="Workspace tools">
          <button
            className="studio-rail-brand"
            aria-label="Open study chat"
            title="Study chat"
            onClick={() => select("chat")}
          >
            <BookOpen size={21} />
          </button>
          <div className="studio-rail-group">
            {[
              "chat",
              "documents",
              "summaries",
              "quizzes",
              "history",
              "dashboard",
            ].map((key) => {
              const Icon = tools[key].icon;
              return (
                <button
                  key={key}
                  aria-label={tools[key].label}
                  title={tools[key].label}
                  aria-pressed={active === key}
                  className={`studio-rail-button ${active === key ? "active" : ""}`}
                  onClick={() => select(key)}
                >
                  <Icon size={18} strokeWidth={1.7} />
                  <span className="rail-tooltip">{tools[key].label}</span>
                </button>
              );
            })}
          </div>
          <div className="studio-rail-bottom">
            <button
              className={`studio-rail-button ${active === "settings" ? "active" : ""}`}
              aria-label="Settings"
              title="Settings"
              aria-pressed={active === "settings"}
              onClick={() => select("settings")}
            >
              <Settings size={18} />
              <span className="rail-tooltip">Settings</span>
            </button>
            <span className="studio-profile" title="Personal workspace">
              S
            </span>
          </div>
        </nav>
        <div className="studio-surface">
          <header className="studio-toolbar">
            <div className="studio-mode-group">
              <span className="studio-mode-label">Workspace</span>
              <div
                className="studio-tabs"
                role="tablist"
                aria-label="Study mode"
              >
                {modes.map((key, index) => {
                  const Icon = tools[key].icon;
                  return (
                    <button
                      key={key}
                      ref={(element) => {
                        tabs.current[key] = element;
                      }}
                      id={`tab-${key}`}
                      role="tab"
                      aria-selected={active === key}
                      aria-controls={`tool-${key}`}
                      tabIndex={
                        active === key ||
                        (!modes.includes(active) && index === 0)
                          ? 0
                          : -1
                      }
                      onKeyDown={(event) => tabKey(event, index)}
                      onClick={() => select(key)}
                    >
                      <Icon size={14} />
                      {tools[key].short}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="studio-toolbar-actions">
              <span
                className={`connection ${connected ? "online" : ""}`}
                role="status"
              >
                <i />
                {health.loading
                  ? "Connecting"
                  : health.error
                    ? "Server offline"
                    : health.data?.ai_configured
                      ? "Gemini configured"
                      : "API key needed"}
              </span>
              <button
                className="studio-add-pdf"
                onClick={() => select("documents")}
              >
                <Plus size={14} /> Add PDF
              </button>
            </div>
          </header>
          <main id="main" className="studio-content" tabIndex={-1}>
            {Object.keys(tools).map((key) => {
              const Tool = tools[key].component;
              return (
                <section
                  key={key}
                  id={`tool-${key}`}
                  className={`workspace-tool workspace-${key}`}
                  hidden={key !== active}
                  role={modes.includes(key) ? "tabpanel" : "region"}
                  aria-labelledby={
                    modes.includes(key) ? `tab-${key}` : undefined
                  }
                  aria-label={
                    modes.includes(key) ? undefined : tools[key].label
                  }
                  tabIndex={0}
                >
                  {(visited.has(key) || active === key) && (
                    <Suspense
                      fallback={
                        <LoadingSpinner text="Opening your study tool…" />
                      }
                    >
                      <Tool />
                    </Suspense>
                  )}
                </section>
              );
            })}
          </main>
          <footer className="studio-statusbar">
            <span>
              <ShieldCheck size={12} /> Grounded in your documents
            </span>
            <span>
              Made for a little more understanding <ArrowUpRight size={12} />
            </span>
          </footer>
        </div>
      </div>
      <footer className="studio-footer">
        <span>ONE WORKSPACE. A WORLD OF POSSIBILITIES.</span>
        <span>
          Study at your own pace <span className="blue">✦</span>
        </span>
      </footer>
    </div>
  );
}
