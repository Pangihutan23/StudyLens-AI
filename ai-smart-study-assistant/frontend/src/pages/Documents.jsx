import { useRef, useState } from "react";
import { WorkspaceLink as Link } from "../components/common/WorkspaceLink";
import {
  Check,
  FileText,
  Files,
  MessageSquare,
  Search,
  Trash2,
  UploadCloud,
  Plus,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import { useResource } from "../hooks/useResource";
import { useApp } from "../context/AppContext";
import { api, date, size } from "../services/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Modal,
  PageHeading,
  Skeleton,
} from "../components/common/UI";

export default function Documents() {
  const docs = useResource("/documents"),
    health = useResource("/health");
  const { toast, selected, setSelected } = useApp();
  const input = useRef();
  const [drag, setDrag] = useState(false),
    [query, setQuery] = useState(""),
    [upload, setUpload] = useState(null),
    [deleting, setDeleting] = useState(null),
    [pending, setPending] = useState(false);
  const max = health.data?.max_upload_mb || 25;
  async function uploadFiles(files) {
    if (upload) return;
    for (const file of Array.from(files)) {
      if (
        !file.name.toLowerCase().endsWith(".pdf") ||
        file.size > max * 1048576
      ) {
        toast(`${file.name}: select a PDF under ${max} MB.`, "error");
        continue;
      }
      setUpload({ name: file.name, progress: 0 });
      const form = new FormData();
      form.append("file", file);
      try {
        await api.post("/documents/upload", form, {
          onUploadProgress: (event) =>
            setUpload({
              name: file.name,
              progress: Math.round(
                (event.loaded / (event.total || file.size)) * 100,
              ),
            }),
        });
        toast(`${file.name} is indexed and ready.`);
      } catch (e) {
        toast(e.message, "error");
      } finally {
        docs.refresh();
      }
    }
    setUpload(null);
    if (input.current) input.current.value = "";
  }
  async function remove() {
    setPending(true);
    try {
      await api.delete(`/documents/${deleting.id}`);
      setSelected(selected.filter((id) => id !== deleting.id));
      toast("Document deleted. Your saved learning history is preserved.");
      setDeleting(null);
      docs.refresh();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setPending(false);
    }
  }
  const filtered = (docs.data || []).filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase()),
  );
  const readySelected = selected.filter((id) =>
    docs.data?.some((d) => d.id === id && d.status === "ready"),
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL KNOWLEDGE LIBRARY"
        title="My documents"
        description="A home for your lectures, readings, and next big ideas."
        action={
          <Button onClick={() => input.current.click()} disabled={!!upload}>
            <Plus size={17} />
            Upload PDF
          </Button>
        }
      />
      {!health.loading && health.data && !health.data.ai_configured && (
        <div className="notice">
          <span>
            Connect Gemini before uploading: add your API key to{" "}
            <code>backend/.env</code>, then restart the backend.
          </span>
          <Link to="/?tool=settings">
            Setup details
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <input
        ref={input}
        className="sr-only"
        type="file"
        multiple
        accept="application/pdf,.pdf"
        aria-label="Choose PDF files"
        onChange={(e) => uploadFiles(e.target.files)}
        disabled={!!upload}
      />
      <button
        className={`dropzone ${drag ? "dragging" : ""}`}
        disabled={!!upload}
        onClick={() => input.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          uploadFiles(e.dataTransfer.files);
        }}
      >
        <span className="upload-icon">
          {upload ? (
            <LoaderCircle className="spin" size={28} />
          ) : (
            <UploadCloud size={28} strokeWidth={1.5} />
          )}
        </span>
        <strong>
          {upload
            ? upload.progress === 100
              ? "Reading, embedding, and indexing…"
              : `Uploading ${upload.progress}%`
            : "Drop your lecture notes here"}
        </strong>
        <p>
          {upload ? (
            upload.name
          ) : (
            <>
              or <span>browse files</span> to start building your knowledge
              library
            </>
          )}
        </p>
        {upload ? (
          <div
            className="upload-progress"
            role="progressbar"
            aria-label="Upload progress"
            aria-valuenow={upload.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${upload.progress}%` }} />
          </div>
        ) : (
          <small>
            PDF documents · Up to {max} MB each · Multiple files welcome
          </small>
        )}
      </button>
      <div className="library-toolbar">
        <div>
          <h2>
            Document library{" "}
            <span className="count">{docs.data?.length || 0}</span>
          </h2>
          <p>
            {readySelected.length
              ? `${readySelected.length} selected as AI context`
              : "Select documents to use as context in AI Chat."}
          </p>
        </div>
        <div className="toolbar-actions">
          {readySelected.length > 0 && (
            <Link to="/?tool=chat" className="btn btn-secondary">
              <MessageSquare size={15} />
              Chat with selected
            </Link>
          )}
          <label className="search-input">
            <Search size={16} />
            <input
              type="search"
              aria-label="Search documents"
              placeholder="Search documents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
      </div>
      {docs.error ? (
        <ErrorState message={docs.error} retry={docs.refresh} />
      ) : docs.loading ? (
        <Skeleton />
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            icon={Files}
            title={
              query ? "No matching documents" : "Your library is a blank page"
            }
            description={
              query
                ? "Try another document name."
                : "Add a PDF above. Your materials will be ready for questions, summaries, and quizzes."
            }
          />
        </Card>
      ) : (
        <div className="document-grid">
          {filtered.map((d) => (
            <Card
              key={d.id}
              className={`document-card ${readySelected.includes(d.id) ? "selected" : ""}`}
            >
              <div className="document-card-top">
                <span className="pdf-icon">
                  <FileText size={25} />
                  <small>PDF</small>
                </span>
                <div className="document-card-tools">
                  {d.status === "ready" && (
                    <input
                      type="checkbox"
                      aria-label={`Use ${d.title} as AI context`}
                      checked={readySelected.includes(d.id)}
                      disabled={
                        !readySelected.includes(d.id) &&
                        readySelected.length >= 10
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...readySelected, d.id]
                            : readySelected.filter((id) => id !== d.id),
                        )
                      }
                    />
                  )}
                  <button
                    className="icon-btn danger-hover"
                    aria-label={`Delete ${d.title}`}
                    disabled={d.status === "processing"}
                    onClick={() => setDeleting(d)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 title={d.title}>{d.title}</h3>
              <p>
                {d.page_count} pages <span>·</span> {size(d.size)}
              </p>
              {d.error && <p className="document-error">{d.error}</p>}
              <div className="document-card-bottom">
                <small>{date(d.created_at)}</small>
                <Badge tone={d.status}>
                  {d.status === "ready" && <Check size={11} />}{" "}
                  {d.status === "ready"
                    ? "Ready to study"
                    : d.status === "processing"
                      ? "Processing"
                      : "Needs attention"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal
        open={!!deleting}
        title="Delete this document?"
        onClose={() => {
          if (!pending) setDeleting(null);
        }}
      >
        <p className="muted">
          “{deleting?.title}” and its searchable text will be removed. Existing
          summaries, conversations, and quiz results stay in your history.
        </p>
        <div className="modal-actions">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => setDeleting(null)}
          >
            Keep document
          </Button>
          <Button variant="danger" loading={pending} onClick={remove}>
            Delete document
          </Button>
        </div>
      </Modal>
    </>
  );
}
