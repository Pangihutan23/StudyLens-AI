import { useEffect, useState } from "react";
import { useToolParams } from "../hooks/useToolParams";
import {
  AlignLeft,
  ArrowRight,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";
import { useResource } from "../hooks/useResource";
import { useApp } from "../context/AppContext";
import { api, date } from "../services/api";
import DocumentSelect from "../components/documents/DocumentSelect";
import {
  Badge,
  Button,
  Card,
  ContentActions,
  EmptyState,
  ErrorState,
  LanguageSelect,
  LoadingSpinner,
  Markdown,
  PageHeading,
  SectionTitle,
  Select,
} from "../components/common/UI";

export default function Summarizer() {
  const docs = useResource("/documents"),
    history = useResource("/summaries");
  const { toast, language, setLanguage } = useApp();
  const [params, setParams] = useToolParams("summaries");
  const [documentId, setDocumentId] = useState(""),
    [type, setType] = useState("Key Points"),
    [length, setLength] = useState("Balanced"),
    [summary, setSummary] = useState(null),
    [pending, setPending] = useState(false),
    [opening, setOpening] = useState(false);
  const current = params.get("id");
  useEffect(() => {
    let active = true;
    if (!current) return;
    setOpening(true);
    api
      .get(`/summaries/${current}`)
      .then((s) => {
        if (active) setSummary(s);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => {
        if (active) setOpening(false);
      });
    return () => {
      active = false;
    };
  }, [current]);
  async function generate(e) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await api.post("/summaries/generate", {
        document_id: documentId,
        summary_type: type,
        length,
        language,
      });
      setSummary(result);
      setParams({ id: result.id });
      history.refresh();
      toast("Your study notes are ready.");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="LESS NOISE. MORE KNOWLEDGE."
        title="Intelligent summaries"
        description="Turn complex material into notes that make sense to you."
      />
      <div className="tool-columns">
        <div>
          <Card className="config-card">
            <div className="config-heading">
              <span className="feature-icon">
                <AlignLeft size={20} />
              </span>
              <div>
                <h2>Shape your study notes</h2>
                <p>Your material, with a little clarity.</p>
              </div>
            </div>
            {docs.error && (
              <ErrorState message={docs.error} retry={docs.refresh} />
            )}
            <form onSubmit={generate}>
              <DocumentSelect
                documents={docs.data || []}
                value={documentId}
                onChange={setDocumentId}
                disabled={pending || docs.loading}
              />
              <Select
                label="Summary format"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={pending}
              >
                {[
                  "Short Summary",
                  "Detailed Summary",
                  "Key Points",
                  "Structured Study Notes",
                  "Beginner-Friendly Explanation",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <Select
                label="Level of detail"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                disabled={pending}
              >
                {["Short", "Balanced", "Comprehensive"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <LanguageSelect
                value={language}
                onChange={setLanguage}
                disabled={pending}
              />
              <Button
                className="full-width"
                type="submit"
                loading={pending}
                disabled={!documentId || docs.loading}
              >
                <Sparkles size={16} />
                {pending ? "Reading your material…" : "Generate summary"}
              </Button>
              <p className="config-footnote">
                <FileText size={13} />
                Every section is considered, even in long PDFs.
              </p>
            </form>
          </Card>
          <div className="tip-note">
            <span className="mono">A STUDY TIP</span>
            <p>
              Try “Beginner-Friendly Explanation” for a new subject, then “Key
              Points” when it’s time to revise.
            </p>
          </div>
        </div>
        <Card className="output-card">
          <div className="output-heading">
            <div>
              <span className="mono">YOUR STUDY NOTES</span>
              {summary && <h3>{summary.document_title}</h3>}
            </div>
            {summary && !pending && <ContentActions text={summary.content} />}
          </div>
          {pending || opening ? (
            <LoadingSpinner
              text={
                pending
                  ? "Reading each section and connecting the ideas. Long PDFs can take a few minutes…"
                  : "Opening saved notes…"
              }
            />
          ) : summary ? (
            <>
              <div className="output-metadata">
                <Badge>{summary.summary_type}</Badge>
                <span>
                  {summary.language} · {date(summary.created_at)}
                </span>
              </div>
              <Markdown>{summary.content}</Markdown>
            </>
          ) : (
            <EmptyState
              icon={AlignLeft}
              title="Clarity is a click away"
              description="Choose your lecture PDF and the kind of notes you need. Your summary will appear here."
            />
          )}
        </Card>
      </div>
      <SectionTitle title="Previously created" />
      {history.error ? (
        <ErrorState message={history.error} retry={history.refresh} />
      ) : history.loading ? (
        <LoadingSpinner text="Loading previous summaries…" />
      ) : !history.data.length ? (
        <p className="muted small-text">
          Your saved summaries will appear here after you generate your first
          set of notes.
        </p>
      ) : (
        <div className="history-cards">
          {history.data.map((s) => (
            <button
              key={s.id}
              className={`card saved-summary ${summary?.id === s.id ? "selected" : ""}`}
              disabled={pending}
              onClick={() => setParams({ id: s.id })}
            >
              <span className="saved-summary-icon">
                <AlignLeft size={18} />
              </span>
              <strong>{s.document_title}</strong>
              <Badge>{s.summary_type}</Badge>
              <small>
                <Clock3 size={12} />
                {date(s.created_at)}
                <ArrowRight size={14} />
              </small>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
