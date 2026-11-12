import { useSearchParams } from "react-router-dom";
import { useRef } from "react";

const keys = {
  chat: { session: "session" },
  summaries: { id: "summary" },
  quizzes: { id: "quiz", attempt: "attempt" },
};

// Mounted tools own separate result parameters. Background requests must not
// switch tools or clear another tool's saved result.
export function useToolParams(tool) {
  const [search, setSearch] = useSearchParams();
  const latest = useRef(search);
  latest.current = search;
  const own = keys[tool];
  const params = new URLSearchParams();
  for (const [local, shared] of Object.entries(own)) {
    if (search.has(shared)) params.set(local, search.get(shared));
  }
  function update(values) {
    const next = new URLSearchParams(latest.current);
    for (const key of Object.values(own)) next.delete(key);
    for (const [local, value] of Object.entries(values)) {
      if (own[local] && value != null) next.set(own[local], value);
    }
    latest.current = next;
    setSearch(next);
  }
  return [params, update];
}
