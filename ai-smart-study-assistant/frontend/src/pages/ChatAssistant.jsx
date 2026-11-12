import { useEffect, useRef, useState } from "react";
import { WorkspaceLink as Link } from "../components/common/WorkspaceLink";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  UploadCloud,
} from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useResource } from "../hooks/useResource";
import { useToolParams } from "../hooks/useToolParams";
import { api } from "../services/api";
import {
  Badge,
  Button,
  ContentActions,
  ErrorState,
  LanguageSelect,
  LoadingSpinner,
  Markdown,
} from "../components/common/UI";

export default function ChatAssistant() {
  const docs = useResource("/documents"),
    sessions = useResource("/chat/sessions"),
    health = useResource("/health");
  const { toast, language, setLanguage, selected, setSelected } = useApp();
  const [params, setParams] = useToolParams("chat");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottom = useRef(),
    input = useRef();
  const current = params.get("session");
  const ready = (docs.data || []).filter((d) => d.status === "ready");
  const selectedReady = selected.filter((id) => ready.some((d) => d.id === id));
  useEffect(() => {
    let active = true;
    if (!current) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessages([]);
    api
      .get(`/chat/sessions/${current}`)
      .then((s) => {
        if (active) {
          setMessages(s.messages);
          setSelected(s.document_ids);
        }
      })
      .catch((e) => {
        if (active) toast(e.message, "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [current]);
  useEffect(() => {
    const container = bottom.current?.parentElement;
    container?.scrollTo({
      top: container.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [messages, pending]);
  async function send(e) {
    e.preventDefault();
    if (
      !question.trim() ||
      !selectedReady.length ||
      pending ||
      loading ||
      uploading
    )
      return;
    const text = question.trim();
    setPending(true);
    setQuestion("");
    try {
      const result = await api.post("/chat", {
        question: text,
        document_ids: selectedReady,
        session_id: current,
        language,
      });
      setMessages((m) => [...m, ...result.messages]);
      if (!current) setParams({ session: result.session.id });
      sessions.refresh();
    } catch (e) {
      setQuestion(text);
      toast(e.message, "error");
    } finally {
      setPending(false);
    }
  }
  async function upload(event) {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    const added = [];
    try {
      for (const file of files) {
        const max = health.data?.max_upload_mb || 25;
        if (
          !file.name.toLowerCase().endsWith(".pdf") ||
          file.size > max * 1048576
        ) {
          toast(`${file.name}: select a PDF under ${max} MB.`, "error");
          continue;
        }
        const form = new FormData();
        form.append("file", file);
        try {
          const doc = await api.post("/documents/upload", form);
          added.push(doc.id);
          toast(`${file.name} is indexed and ready.`);
        } catch (error) {
          toast(error.message, "error");
        }
      }
      if (added.length)
        setSelected([...new Set([...selected, ...added])].slice(0, 10));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  async function removeSession(id) {
    try {
      await api.delete(`/chat/sessions/${id}`);
      if (current === id) setParams({});
      sessions.refresh();
      toast("Conversation deleted.");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <div className="chat-workspace">
      <aside className="chat-context">
        <div className="studio-panel-title">
          <span className="studio-panel-icon">
            <FileText size={17} />
          </span>
          <div>
            <h2>Your study material</h2>
            <p>A good question starts with your notes.</p>
          </div>
        </div>
        <input
          className="sr-only"
          type="file"
          accept=".pdf,application/pdf"
          multiple
          ref={input}
          aria-label="Upload study PDFs"
          onChange={upload}
          disabled={pending || uploading}
        />
        <button
          className="studio-upload"
          onClick={() => input.current?.click()}
          disabled={pending || uploading}
        >
          <UploadCloud size={23} strokeWidth={1.5} />
          <span>
            <strong>
              {uploading
                ? "Reading and indexing your PDF…"
                : "Bring your notes along"}
            </strong>
            <small>
              {uploading
                ? "This can take a moment. Your file stays in this workspace."
                : `Click to upload a PDF · Up to ${health.data?.max_upload_mb || 25} MB each`}
            </small>
          </span>
          <Plus size={16} />
        </button>
        <div className="context-heading">
          <span className="mono">YOUR DOCUMENTS</span>
          <Link to="/?tool=documents" className="studio-manage-link">
            Manage <ArrowUpRight size={12} />
          </Link>
        </div>
        {docs.error ? (
          <ErrorState message={docs.error} retry={docs.refresh} />
        ) : docs.loading ? (
          <LoadingSpinner text="Loading documents…" />
        ) : !ready.length ? (
          <p className="helper">
            Upload a PDF above to give your conversation some context.
          </p>
        ) : (
          <div className="context-documents">
            {ready.map((d) => (
              <label
                className={`context-document ${selectedReady.includes(d.id) ? "active" : ""}`}
                key={d.id}
              >
                <input
                  type="checkbox"
                  aria-label={`Use ${d.title} as AI context`}
                  checked={selectedReady.includes(d.id)}
                  disabled={
                    pending ||
                    uploading ||
                    (!selectedReady.includes(d.id) &&
                      selectedReady.length >= 10)
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selectedReady, d.id]
                        : selectedReady.filter((i) => i !== d.id),
                    )
                  }
                />
                <FileText size={16} />
                <span title={d.title}>
                  {d.title}
                  <small>{d.page_count} pages · Ready to study</small>
                </span>
                {selectedReady.includes(d.id) && <Check size={13} />}
              </label>
            ))}
          </div>
        )}
        <LanguageSelect
          value={language}
          onChange={setLanguage}
          disabled={pending || uploading}
        />
        <form className="chat-composer" onSubmit={send}>
          <label className="studio-question-label" htmlFor="study-question">
            What would you like to understand?
          </label>
          <textarea
            id="study-question"
            aria-label="Your question"
            placeholder={
              selectedReady.length
                ? "Ask a question, explore an idea, or untangle something in your notes…"
                : "Select a PDF above, then ask your first question…"
            }
            value={question}
            maxLength={6000}
            disabled={pending || loading || uploading}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                send(e);
              }
            }}
          />
          <div className="studio-composer-footer">
            <span>{question.length.toLocaleString()} / 6,000</span>
            <button
              className="send-button"
              type="submit"
              aria-label="Send question"
              disabled={
                pending ||
                loading ||
                uploading ||
                !selectedReady.length ||
                !question.trim()
              }
            >
              {pending ? "Thinking…" : "Ask your assistant"}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
        <details className="studio-conversations">
          <summary>
            <HistoryIcon /> Recent conversations{" "}
            <span>{sessions.data?.length || 0}</span>
          </summary>
          {sessions.error ? (
            <ErrorState message={sessions.error} retry={sessions.refresh} />
          ) : sessions.loading ? (
            <LoadingSpinner text="Loading history…" />
          ) : !sessions.data.length ? (
            <p className="helper">Your conversations will appear here.</p>
          ) : (
            <div className="session-list">
              {sessions.data.map((s) => (
                <div key={s.id} className={current === s.id ? "active" : ""}>
                  <button
                    disabled={pending}
                    onClick={() => setParams({ session: s.id })}
                  >
                    {s.title}
                  </button>
                  <button
                    className="icon-btn danger-hover"
                    disabled={pending}
                    aria-label={`Delete conversation: ${s.title}`}
                    onClick={() => removeSession(s.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </details>
        <p className="studio-enter-hint">
          Enter to send <span>·</span> Shift + Enter for a new line
        </p>
      </aside>
      <section className="chat-panel" aria-label="Assistant response">
        <header className="chat-panel-heading">
          <span className="chat-assistant-icon">
            <Sparkles size={17} />
          </span>
          <div>
            <h2>Your study companion</h2>
            <small>A little perspective. Grounded in your notes.</small>
          </div>
          <Badge>
            {selectedReady.length} PDF{selectedReady.length !== 1 ? "s" : ""}
          </Badge>
          <Button
            variant="ghost"
            onClick={() => setParams({})}
            disabled={pending || loading}
            aria-label="New chat"
          >
            <Plus size={15} />
            <span>New chat</span>
          </Button>
        </header>
        <div className="chat-messages">
          {loading ? (
            <LoadingSpinner text="Opening conversation…" />
          ) : !messages.length ? (
            <div className="chat-empty">
              <div className="studio-orbit" aria-hidden="true">
                <div className="studio-orbit-ring" />
                <div className="studio-orbit-core">
                  <BookOpen size={34} strokeWidth={1.25} />
                </div>
                <span className="studio-orbit-spark">
                  <Sparkles size={15} />
                </span>
              </div>
              <span className="eyebrow">A FRESH PERSPECTIVE AWAITS</span>
              <h2>
                Big ideas start with
                <br />
                <em>a little curiosity.</em>
              </h2>
              <p>
                Add your material, ask what is on your mind,
                <br />
                and let the connections come into focus.
              </p>
              <div className="suggestions">
                {[
                  "Explain the main concepts simply",
                  "How are the key ideas connected?",
                  "What should I focus on for an exam?",
                ].map((q) => (
                  <button
                    key={q}
                    disabled={pending || loading}
                    onClick={() => {
                      setQuestion(q);
                      document.getElementById("study-question")?.focus();
                    }}
                  >
                    {q}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
              <span className="studio-empty-footnote">
                <Search size={12} /> Answers with references, directly from your
                PDFs.
              </span>
            </div>
          ) : (
            messages.map((m) => (
              <motion.article
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={m.id}
                className={`message ${m.role}`}
              >
                <span className="message-avatar">
                  {m.role === "user" ? (
                    <User size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </span>
                <div className="message-body">
                  <span className="message-label">
                    {m.role === "user" ? "YOU" : "STUDY ASSISTANT"}
                  </span>
                  {m.role === "assistant" ? (
                    <Markdown>{m.content}</Markdown>
                  ) : (
                    <p className="user-text">{m.content}</p>
                  )}
                  {m.sources?.length > 0 && (
                    <div className="message-sources">
                      <span className="mono">RETRIEVED SOURCES</span>
                      {m.sources.map((s) => (
                        <span key={`${s.document_id}-${s.page}`}>
                          <FileText size={12} />
                          {s.document_title} · p. {s.page}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.role === "assistant" && (
                    <ContentActions
                      text={m.content}
                      filename="study-conversation.md"
                    />
                  )}
                </div>
              </motion.article>
            ))
          )}
          {pending && (
            <div className="thinking" role="status">
              <Sparkles size={16} />
              <span>Finding connections in your material</span>
              <span className="thinking-dots">•••</span>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <div className="studio-response-note">
          <Check size={12} /> Thoughtful answers. Always check the source.
        </div>
      </section>
    </div>
  );
}
function HistoryIcon() {
  return <MessageSquare size={13} />;
}
