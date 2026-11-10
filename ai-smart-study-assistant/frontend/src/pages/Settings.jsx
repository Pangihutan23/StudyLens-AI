import {
  Check,
  ExternalLink,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useResource } from "../hooks/useResource";
import { useApp } from "../context/AppContext";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LanguageSelect,
  LoadingSpinner,
  PageHeading,
} from "../components/common/UI";

export default function Settings() {
  const health = useResource("/health");
  const { language, setLanguage, toast } = useApp();
  return (
    <>
      <PageHeading
        eyebrow="MAKE THIS SPACE YOURS"
        title="Workspace settings"
        description="Your preferences and a clear view of your connection."
      />
      <div className="settings-grid">
        <Card className="settings-card">
          <span className="feature-icon">
            <Settings2 size={21} />
          </span>
          <h2>Learning preferences</h2>
          <p>
            Set your default language for conversations, summaries, and quizzes.
          </p>
          <LanguageSelect
            value={language}
            onChange={(value) => {
              setLanguage(value);
              toast("Language preference saved.");
            }}
          />
          <small className="muted">
            Saved in this browser. You can also change it in each tool.
          </small>
        </Card>
        <Card className="settings-card">
          <div className="flex-between">
            <span className="feature-icon">
              <Server size={21} />
            </span>
            <Button
              variant="ghost"
              onClick={health.refresh}
              loading={health.loading}
            >
              <RefreshCw size={14} />
              Check connection
            </Button>
          </div>
          <h2>Study server</h2>
          {health.error ? (
            <ErrorState message={health.error} retry={health.refresh} />
          ) : health.loading ? (
            <LoadingSpinner text="Checking your connection…" />
          ) : (
            <>
              <div className="setting-line">
                <span>Backend</span>
                <Badge tone="ready">
                  <Check size={12} />
                  Connected
                </Badge>
              </div>
              <div className="setting-line">
                <span>Gemini API</span>
                <Badge tone={health.data.ai_configured ? "ready" : "error"}>
                  {health.data.ai_configured ? "Configured" : "API key needed"}
                </Badge>
              </div>
              <div className="setting-line">
                <span>Generation model</span>
                <code>{health.data.model}</code>
              </div>
              <div className="setting-line">
                <span>Embeddings</span>
                <code>{health.data.embedding_model}</code>
              </div>
              <div className="setting-line">
                <span>Vector dimensions</span>
                <span>{health.data.embedding_dimensions}</span>
              </div>
              <small className="muted">
                “Configured” confirms a key is present. API access is checked
                when you use an AI feature.
              </small>
            </>
          )}
        </Card>
        <Card className="settings-card setup-card">
          <div>
            <span className="feature-icon">
              <ShieldCheck size={21} />
            </span>
            <h2>A private key, on your server.</h2>
            <p>
              Copy <code>backend/.env.example</code> to{" "}
              <code>backend/.env</code>, add your Gemini API key, and restart
              FastAPI. Your key is never stored in the browser.
            </p>
            <ol>
              <li>Create a key in Google AI Studio.</li>
              <li>
                Set <code>GEMINI_API_KEY</code> and an available{" "}
                <code>GEMINI_MODEL</code>.
              </li>
              <li>Restart the backend and check the connection above.</li>
            </ol>
            <a
              className="text-link"
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Google AI Studio
              <ExternalLink size={14} />
            </a>
          </div>
          <div className="privacy-note">
            <ShieldCheck size={27} strokeWidth={1.2} />
            <h3>Your workspace stays local.</h3>
            <p>
              Documents and study history are stored on this computer. Extracted
              text is sent to Google Gemini when you index documents or use AI
              tools.
            </p>
            <p>
              This is a personal, single-user workspace with no sign-in. Keep
              the server bound to localhost.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
