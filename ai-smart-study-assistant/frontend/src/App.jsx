import { Component } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/layout/Layout";

class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fatal-error">
        <h1>This workspace needs a fresh start.</h1>
        <p>Your saved data is still on the server.</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

// Existing bookmarks and saved history still open the right tool and result.
function LegacyRedirect() {
  const { pathname, search } = useLocation();
  const tool = pathname.split("/")[2] || "dashboard";
  const params = new URLSearchParams(search);
  if (params.has("id") && ["summaries", "quizzes"].includes(tool)) {
    params.set(tool === "summaries" ? "summary" : "quiz", params.get("id"));
    params.delete("id");
  }
  params.set("tool", tool);
  return <Navigate to={`/?${params}`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />} />
              <Route path="/app/*" element={<LegacyRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
