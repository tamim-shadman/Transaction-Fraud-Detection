import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bookmark, Check, ExternalLink, Plus, Trash2, X } from "lucide-react";

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  path: string;
  search: string;
  timestamp: string;
}

const STORAGE_KEY = "fraud-console.saved-views";

export function getSavedViews(): SavedView[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveView(view: Omit<SavedView, "id" | "timestamp">): SavedView[] {
  try {
    const current = getSavedViews();
    const newView: SavedView = {
      ...view,
      id: "view_" + Date.now().toString(36),
      timestamp: new Date().toISOString(),
    };
    const updated = [newView, ...current.filter((v) => v.name !== view.name)].slice(0, 20);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteSavedView(id: string): SavedView[] {
  try {
    const current = getSavedViews();
    const updated = current.filter((v) => v.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function SavedViewsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setViews(getSavedViews());
      setIsSaving(false);
      setName("");
      setDesc("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const updated = saveView({
      name: name.trim(),
      description: desc.trim() || undefined,
      path: location.pathname,
      search: location.search,
    });
    setViews(updated);
    setIsSaving(false);
    setName("");
    setDesc("");
  };

  const handleApply = (v: SavedView) => {
    navigate(`${v.path}${v.search}`);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSavedView(id);
    setViews(updated);
  };

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Saved Analytical Views" ref={modalRef} style={{ maxWidth: 540 }}>
        <div className="p2-drawer-head" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="row wrap items-center" style={{ gap: 8 }}>
            <Bookmark size={16} className="text-primary" />
            <h2 style={{ fontSize: 16, margin: 0 }}>Saved Workspaces & Views</h2>
          </div>
          <button type="button" className="icon-btn tiny" onClick={onClose} aria-label="Close dialog">
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {!isSaving ? (
            <div className="row wrap justify-between items-center mb-16">
              <span className="text-xs muted">{views.length} saved views in local browser storage</span>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => setIsSaving(true)}>
                <Plus size={12} /> Save current view
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveCurrent} className="mb-16 p-12 bg-hover rounded border">
              <div className="text-xs font-semibold mb-8">Save Current Analytical State</div>
              <div className="text-xs muted mb-8">
                Route: <code>{location.pathname}{location.search}</code>
              </div>
              <input
                className="input text-sm w-full mb-8"
                placeholder="View name (e.g. Model Ablation PR-AUC)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <input
                className="input text-sm w-full mb-8"
                placeholder="Optional description / notes"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <div className="row wrap justify-end" style={{ gap: 8 }}>
                <button type="button" className="btn btn-sm" onClick={() => setIsSaving(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  <Check size={12} /> Save View
                </button>
              </div>
            </form>
          )}

          <div className="saved-views-list" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
            {views.length === 0 ? (
              <div className="text-center p-20 text-xs muted">
                No saved views yet. Customize filters on any page and click "Save current view" to create a quick-access bookmark.
              </div>
            ) : (
              views.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleApply(v)}
                  className="saved-view-item p-10 rounded border bg-card hover-bg cursor-pointer flex justify-between items-center"
                  style={{ transition: "all 0.15s ease" }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 10 }}>
                    <div className="font-semibold text-sm">{v.name}</div>
                    {v.description && <div className="text-xs muted mt-2">{v.description}</div>}
                    <div className="text-xs muted mt-4 font-mono">
                      {v.path}{v.search} · {new Date(v.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="row wrap items-center" style={{ gap: 6 }}>
                    <button
                      type="button"
                      className="icon-btn tiny"
                      onClick={(e) => handleDelete(v.id, e)}
                      title="Delete saved view"
                      aria-label="Delete saved view"
                    >
                      <Trash2 size={12} className="text-danger" />
                    </button>
                    <ExternalLink size={13} className="muted" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
