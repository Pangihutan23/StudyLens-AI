import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export function useResource(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const invalidate = (event) => {
      const resource = path.split("/")[1];
      const changed = event.detail?.split("/")[1];
      if (resource === changed || resource === "dashboard") refresh();
    };
    window.addEventListener("study:data-changed", invalidate);
    return () => window.removeEventListener("study:data-changed", invalidate);
  }, [path, refresh]);
  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setState((s) => ({ ...s, loading: false, error: error.message }));
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return { ...state, refresh };
}
