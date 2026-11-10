import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export function useResource(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
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
