import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Analysis, Manifest } from "../types";
import { loadAnalysis, loadManifest } from "../lib/data";

interface AppState {
  manifest: Manifest | null;
  analysis: Analysis | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const AppContext = createContext<AppState>({
  manifest: null,
  analysis: null,
  loading: true,
  error: null,
  reload: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([loadManifest(), loadAnalysis()])
      .then(([m, a]) => {
        if (!active) return;
        setManifest(m);
        setAnalysis(a);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  const value = useMemo(
    () => ({ manifest, analysis, loading, error, reload }),
    [manifest, analysis, loading, error, reload],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

export function useManifest() {
  const { manifest } = useApp();
  if (!manifest) throw new Error("Manifest is not loaded");
  return manifest;
}

export function useAnalysis() {
  const { analysis } = useApp();
  if (!analysis) throw new Error("Analysis is not loaded");
  return analysis;
}
