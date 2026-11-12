import { WorkspaceLink as Link } from "../common/WorkspaceLink";
import { useEffect } from "react";
import { FileText } from "lucide-react";
import { Select } from "../common/UI";

export default function DocumentSelect({
  documents = [],
  value,
  onChange,
  disabled,
}) {
  const ready = documents.filter((d) => d.status === "ready");
  useEffect(() => {
    if (value && !ready.some((document) => document.id === value)) onChange("");
  }, [documents, value, onChange]);
  return (
    <>
      <Select
        label="Source document"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select a lecture PDF</option>
        {ready.map((d) => (
          <option key={d.id} value={d.id}>
            {d.title}
          </option>
        ))}
      </Select>
      {!ready.length && (
        <p className="helper">
          <FileText size={14} />
          No indexed PDFs yet.{" "}
          <Link to="/?tool=documents">Upload a document</Link>
        </p>
      )}
    </>
  );
}
