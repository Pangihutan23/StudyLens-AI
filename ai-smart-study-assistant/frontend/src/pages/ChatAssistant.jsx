import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUp,
  BookOpen,
  Check,
  FileText,
  MessageSquare,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useResource } from "../hooks/useResource";
import { api } from "../services/api";
import {
  Badge,
  Button,
  ContentActions,
  ErrorState,
  LanguageSelect,
  LoadingSpinner,
  Markdown,
  PageHeading,
} from "../components/common/UI";

export default function ChatAssistant() {
  const docs = useResource("/documents"),
    sessions = useResource("/chat/sessions");
  const { toast, language, setLanguage, selected, setSelected } = useApp();
  const [params, setParams] = useSearchParams();
  const [messages, setMessages] = useState([]),
    [question, setQuestion] = useState(""),
    [pending, setPending] = useState(false),
    [loading, setLoading] = useState(false),
    [sourcesOpen, setSourcesOpen] = useState(false);
  const bottom = useRef();
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
    if (!question.trim() || !selectedReady.length || pending) return;
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
    <>
      <PageHeading
        eyebrow="THINK IT THROUGH, TOGETHER"
        title="AI chat assistant"
        description="A conversation with your notes. A clearer way to understand."
        action={
          <Button
            variant="secondary"
            onClick={() => setParams({})}
            disabled={pending}
          >
            <Plus size={16} />
            New chat
          </Button>
        }
      />
      <div className="chat-workspace">
        <aside className={`chat-context ${sourcesOpen ? "show-context" : ""}`}>
          <div className="context-heading">
            <span className="mono">STUDY CONTEXT</span>
            <BookOpen size={16} />
          </div>
          <p className="helper">Choose up to 10 PDFs for this conversation.</p>
          {docs.error ? (
            <ErrorState message={docs.error} retry={docs.refresh} />
          ) : docs.loading ? (
            <LoadingSpinner text="Loading documents…" />
          ) : !ready.length ? (
            <p className="helper">
              Upload and index a PDF in My Documents to start chatting.
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
                    checked={selectedReady.includes(d.id)}
                    disabled={
                      pending ||
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
                  <FileText size={17} />
                  <span>{d.title}</span>
                </label>
              ))}
            </div>
          )}
          <LanguageSelect
            value={language}
            onChange={setLanguage}
            disabled={pending}
          />
          <div className="context-heading history-label">
            <span className="mono">RECENT CONVERSATIONS</span>
            <MessageSquare size={15} />
          </div>
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
          <div className="context-note">
            <Check size={14} />
            Grounded in your documents.
            <br />
            Check source pages for context.
          </div>
        </aside>
        <section className="chat-panel">
          <header className="chat-panel-heading">
            <span className="chat-assistant-icon">
              <Sparkles size={18} />
            </span>
            <div>
              <strong>Your study companion</strong>
              <small>Powered by Gemini · Grounded in your notes</small>
            </div>
            <Button
              variant="ghost"
              className="context-toggle"
              onClick={() => setSourcesOpen((v) => !v)}
              aria-expanded={sourcesOpen}
            >
              <SlidersHorizontal size={16} />
              Context
            </Button>
            <Badge>
              {selectedReady.length} PDF{selectedReady.length !== 1 ? "s" : ""}{" "}
              selected
            </Badge>
          </header>
          <div className="chat-messages">
            {loading ? (
              <LoadingSpinner text="Opening conversation…" />
            ) : !messages.length ? (
              <div className="chat-empty">
                <div className="chat-empty-symbol">
                  <Sparkles size={31} strokeWidth={1.3} />
                </div>
                <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
                <h2>
                  What would you like
                  <br />
                  to understand?
                </h2>
                <p>
                  Select your lecture PDFs, then ask a question.
                  <br />
                  We’ll find the answers in your materials.
                </p>
                <div className="suggestions">
                  {[
                    "Explain the main concepts simply",
                    "How are the key ideas connected?",
                    "What should I focus on for an exam?",
                  ].map((q) => (
                    <button key={q} onClick={() => setQuestion(q)}>
                      {q}
                      <ArrowUp size={14} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <motion.article
                  initial={{ opacity: 0, y: 8 }}
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
          <form className="chat-composer" onSubmit={send}>
            <div>
              <textarea
                aria-label="Your question"
                placeholder={
                  selectedReady.length
                    ? "Ask anything about your materials…"
                    : "Select a PDF in Study context to get started…"
                }
                value={question}
                maxLength={6000}
                disabled={pending || loading}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
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
              <button
                className="send-button"
                type="submit"
                aria-label="Send question"
                disabled={
                  pending ||
                  loading ||
                  !selectedReady.length ||
                  !question.trim()
                }
              >
                <ArrowUp size={20} />
              </button>
            </div>
            <p>
              <span>
                <Search size={11} />
                Answers from your PDFs, with source references.
              </span>
              <span>Enter to send · Shift + Enter for a new line</span>
            </p>
          </form>
        </section>
      </div>
    </>
  );
}
