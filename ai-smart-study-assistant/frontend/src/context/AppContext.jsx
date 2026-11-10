import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const Context = createContext(null);
function saved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [language, setLanguageState] = useState(() => {
    const value = saved("study-language", "English");
    return typeof value === "string" ? value : "English";
  });
  const [selected, setSelectedState] = useState(() => {
    const value = saved("study-documents", []);
    return Array.isArray(value)
      ? value.filter((id) => typeof id === "string").slice(0, 10)
      : [];
  });
  const toast = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);
  const setLanguage = (value) => {
    setLanguageState(value);
    localStorage.setItem("study-language", JSON.stringify(value));
  };
  const setSelected = (value) => {
    setSelectedState(value);
    localStorage.setItem("study-documents", JSON.stringify(value));
  };
  return (
    <Context.Provider
      value={{ toast, language, setLanguage, selected, setSelected }}
    >
      {children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`toast ${t.type}`}
              role={t.type === "error" ? "alert" : "status"}
            >
              {t.type === "error" ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              <span>{t.message}</span>
              <button
                aria-label="Dismiss notification"
                onClick={() =>
                  setToasts((ts) => ts.filter((x) => x.id !== t.id))
                }
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
