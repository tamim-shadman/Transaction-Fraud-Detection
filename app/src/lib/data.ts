import type {
  Analysis,
  Manifest,
  NotebookData,
  Phase2Anomalies,
  Phase2Artifacts,
  Phase2ExperimentData,
  Phase2Insights,
  Phase2Lineage,
  Phase2Logs,
  Phase2Metrics,
  Phase2Program,
  Phase2ProjectsPayload,
  TableData,
} from "../types";

const BASE = import.meta.env.BASE_URL || "./";
const cache = new Map<string, Promise<any>>();

export function clearCache(path?: string): void {
  if (path) cache.delete(path);
  else cache.clear();
}

function cleanUrl(path: string): string {
  const cleanBase = BASE.endsWith("/") ? BASE : `${BASE}/`;
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}${cleanPath}`;
}

function fetchJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const url = cleanUrl(path);
    const promise = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
        return response.json() as Promise<T>;
      })
      .catch((error) => {
        // Evict failed requests so subsequent retries can succeed
        cache.delete(path);
        throw error;
      });
    cache.set(path, promise);
  }
  return cache.get(path) as Promise<T>;
}

export const loadManifest = () => fetchJson<Manifest>("data/manifest.json");
export const loadAnalysis = () => fetchJson<Analysis>("data/analysis.json");
export const loadNotebook = () => fetchJson<NotebookData>("data/notebook.json");
export const loadTable = (id: string) => {
  if (!/^[a-z0-9_]+$/.test(id)) throw new Error(`Invalid table id: ${id}`);
  return fetchJson<TableData>(`data/tables/${id}.json`);
};

export const loadProgram = () => fetchJson<Phase2Program>("data/phase2/program.json");
export const loadProjects = () => fetchJson<Phase2ProjectsPayload>("data/phase2/projects.json");
export const loadExperiments = () => fetchJson<Phase2ExperimentData>("data/phase2/experiments.json");
export const loadArtifacts = () => fetchJson<Phase2Artifacts>("data/phase2/artifacts.json");
export const loadInsights = () => fetchJson<Phase2Insights>("data/phase2/insights.json");
export const loadAnomalies = () => fetchJson<Phase2Anomalies>("data/phase2/anomalies.json");
export const loadMetrics = () => fetchJson<Phase2Metrics>("data/phase2/metrics.json");
export const loadLogs = () => fetchJson<Phase2Logs>("data/phase2/logs.json");
export const loadLineage = () => fetchJson<Phase2Lineage>("data/phase2/lineage.json");

export const asset = (path: string) => cleanUrl(path);
