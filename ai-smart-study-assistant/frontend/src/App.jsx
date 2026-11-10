import { Component, Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/layout/Layout";
import { EmptyState, LoadingSpinner } from "./components/common/UI";
import LandingPage from "./pages/LandingPage";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Documents = lazy(() => import("./pages/Documents"));
const ChatAssistant = lazy(() => import("./pages/ChatAssistant"));
const Summarizer = lazy(() => import("./pages/Summarizer"));
const QuizGenerator = lazy(() => import("./pages/QuizGenerator"));
const LearningHistory = lazy(() => import("./pages/LearningHistory"));
const Settings = lazy(() => import("./pages/Settings"));

class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fatal-error">
        <h1>This page needs a fresh start.</h1>
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
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AppProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense
              fallback={<LoadingSpinner text="Opening your study space…" />}
            >
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="chat" element={<ChatAssistant />} />
                  <Route path="summaries" element={<Summarizer />} />
                  <Route path="quizzes" element={<QuizGenerator />} />
                  <Route path="history" element={<LearningHistory />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route
                  path="*"
                  element={
                    <EmptyState
                      title="This page isn’t in your notes"
                      description="Let’s get you back to your study space."
                      action={
                        <Link className="btn btn-primary" to="/app">
                          Open workspace
                        </Link>
                      }
                    />
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
