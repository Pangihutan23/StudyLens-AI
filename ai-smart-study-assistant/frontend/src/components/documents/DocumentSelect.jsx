import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Select } from "../common/UI";

export default function DocumentSelect({
  documents = [],
  value,
  onChange,
  disabled,
}) {
  const ready = documents.filter((d) => d.status === "ready");
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
          <Link to="/app/documents">Upload a document</Link>
        </p>
      )}
    </>
  );
}
