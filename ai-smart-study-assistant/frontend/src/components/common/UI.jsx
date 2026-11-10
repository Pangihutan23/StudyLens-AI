import { Suspense, lazy, useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Copy,
  Download,
  LoaderCircle,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import Reveal from "./Reveal";

const MarkdownRenderer = lazy(() => import("./Markdown"));

export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      {...props}
      disabled={props.disabled || loading}
    >
      {loading && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function Card({ children, className = "", ...props }) {
  return (
    <Reveal distance={0} className={`card ${className}`} {...props}>
      {children}
    </Reveal>
  );
}
export function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Field({ label, children, hint }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {typeof children === "function" ? children(id) : children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Input({ label, hint, ...props }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <input id={id} {...props} />}
    </Field>
  );
}
export function Select({ label, children, ...props }) {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} {...props}>
          {children}
        </select>
      )}
    </Field>
  );
}
export function LoadingSpinner({ text = "Loading your workspace…" }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{text}</span>
    </div>
  );
}
export function Skeleton() {
  return (
    <div className="skeleton-grid" aria-label="Loading" role="status">
      {[1, 2, 3].map((n) => (
        <div className="skeleton card" key={n} />
      ))}
    </div>
  );
}
export function EmptyState({
  icon: Icon = BookOpen,
  title,
  description,
  action,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={27} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={21} />
      <div>
        <strong>Something needs your attention</strong>
        <p>{message}</p>
      </div>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow || "YOUR LEARNING WORKSPACE"}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function SectionTitle({ title, to, label = "View all" }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {to && (
        <Link className="text-link" to={to}>
          {label}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
export function Markdown({ children }) {
  return (
    <Suspense fallback={<LoadingSpinner text="Formatting your notes…" />}>
      <MarkdownRenderer>{children}</MarkdownRenderer>
    </Suspense>
  );
}
export function ContentActions({ text, filename = "study-notes.md" }) {
  const { toast } = useApp();
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard.");
    } catch {
      toast("Clipboard is unavailable in this browser.", "error");
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast("Your notes have been downloaded.");
  }
  return (
    <div className="content-actions">
      <Button variant="ghost" onClick={copy} aria-label="Copy response">
        <Copy size={15} />
        Copy
      </Button>
      <Button variant="ghost" onClick={download}>
        <Download size={15} />
        Download
      </Button>
    </div>
  );
}
export function Modal({ open, title, children, onClose }) {
  const ref = useRef();
  const id = useId();
  useEffect(() => {
    if (open && !ref.current.open) ref.current.showModal();
    if (!open && ref.current.open) ref.current.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function LanguageSelect({ value, onChange, disabled }) {
  return (
    <Select
      label="Output language"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option>English</option>
      <option>Bahasa Indonesia</option>
      <option>Español</option>
      <option>Français</option>
      <option>Deutsch</option>
      <option>日本語</option>
    </Select>
  );
}
