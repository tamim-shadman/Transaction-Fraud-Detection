import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Image as ImageIcon, X } from "lucide-react";
import type { Figure } from "../types";
import { asset } from "../lib/data";
import { fmtBytes } from "../lib/format";

export function FigureLightbox({
  figures,
  index,
  onClose,
  onIndex,
}: {
  figures: Figure[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const figure = figures[index];

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onIndex((index + 1) % figures.length);
      if (event.key === "ArrowLeft") onIndex((index - 1 + figures.length) % figures.length);
    };
    window.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
    };
  }, [index, figures.length, onClose, onIndex]);

  if (!figure) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={figure.title}>
      <div className="lightbox-head">
        <ImageIcon size={15} />
        <span className="lightbox-title">{figure.title}</span>
        <a className="icon-btn" href={asset(figure.full)} target="_blank" rel="noreferrer" title="Open original in new tab" style={{ borderColor: "rgba(255,255,255,.18)", background: "rgba(255,255,255,.07)", color: "#fff" }}>
          <ExternalLink />
        </a>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close image" style={{ borderColor: "rgba(255,255,255,.18)", background: "rgba(255,255,255,.07)", color: "#fff" }}>
          <X />
        </button>
      </div>
      <div className="lightbox-body">
        {figures.length > 1 ? (
          <button type="button" className="lightbox-nav prev" onClick={() => onIndex((index - 1 + figures.length) % figures.length)} aria-label="Previous figure">
            <ChevronLeft size={18} />
          </button>
        ) : null}
        <img src={asset(figure.full)} alt={figure.caption || figure.title} />
        {figures.length > 1 ? (
          <button type="button" className="lightbox-nav next" onClick={() => onIndex((index + 1) % figures.length)} aria-label="Next figure">
            <ChevronRight size={18} />
          </button>
        ) : null}
      </div>
      <div className="lightbox-foot">
        <span>{figure.caption || figure.title}</span>
        <span>
          {figure.phase} · {figure.group} · {fmtBytes(figure.bytes)} · {index + 1} / {figures.length}
        </span>
      </div>
    </div>
  );
}

export function FigureThumb({ figure, onClick, tag }: { figure: Figure; onClick: () => void; tag?: string }) {
  return (
    <button type="button" className="figure-card" onClick={onClick} aria-label={`View ${figure.title}`}>
      <div className="figure-thumb">
        {figure.thumb ? <img loading="lazy" src={asset(figure.thumb)} alt="" /> : <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#9a958c" }}><ImageIcon size={22} /></div>}
        <span className="fig-tag">{tag ?? figure.phase}</span>
      </div>
      <div className="figure-caption">{figure.caption || figure.title}</div>
    </button>
  );
}

export function FigureStrip({ figures }: { figures: Figure[] }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!figures.length) return null;
  return (
    <>
      <div className="figure-strip">
        {figures.slice(0, 3).map((figure, figureIndex) => (
          <FigureThumb key={figure.id} figure={figure} onClick={() => setIndex(figureIndex)} />
        ))}
      </div>
      {index !== null ? (
        <FigureLightbox figures={figures} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
      ) : null}
    </>
  );
}
