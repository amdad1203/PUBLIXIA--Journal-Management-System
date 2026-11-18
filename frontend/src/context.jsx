import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "./api";
import { primaryRole } from '../../shared/workspaces';
const Context = createContext(null);
export function Provider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [toast, setToast] = useState(null);
  const [selectedWorkspace,setWorkspace] = useState(null);
  const workspaceRole=user?.roles.includes(selectedWorkspace)?selectedWorkspace:primaryRole(user);
  useEffect(() => {
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  const notify = useCallback(
    (message, error = false) => setToast({ message, error }),
    [],
  );
  return (
    <Context.Provider value={{ user, setUser, ready, notify, workspaceRole, setWorkspace }}>
      {children}
      {toast && (
        <div className={`toast ${toast.error ? "error" : ""}`} role="status">
          {toast.message}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
export function useLoad(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    setData(null);
    if (!path) return;
    api(path)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return { data, setData, error, reload: () => setVersion((v) => v + 1) };
}
export function useAction() {
  const { notify } = useApp();
  const [busy, setBusy] = useState(false);
  const run = async (fn, message) => {
    setBusy(true);
    try {
      const value = await fn();
      if (message) notify(message);
      return value;
    } catch (e) {
      notify(e.message, true);
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}
