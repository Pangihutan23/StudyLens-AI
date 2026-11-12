import { Link, useLocation } from "react-router-dom";

// Keep the other tools' result IDs when navigating within the shared page.
export function WorkspaceLink({ to, ...props }) {
  const { search } = useLocation();
  let target = to;
  if (typeof to === "string" && to.startsWith("/?tool=")) {
    const requested = new URLSearchParams(to.slice(2));
    const merged = new URLSearchParams(search);
    if (requested.has("attempt")) merged.delete("quiz");
    if (requested.has("quiz")) merged.delete("attempt");
    for (const [key, value] of requested) merged.set(key, value);
    target = `/?${merged}`;
  }
  return <Link to={target} {...props} />;
}
