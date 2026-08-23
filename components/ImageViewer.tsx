"use client";

import { useEffect, useRef, useState } from "react";

export type ImageViewerImage = {
  id: string;
  src: string;
  thumbnailSrc?: string;
  alt?: string;
};

type ImageWithStateProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ImageWithState({ src, alt, className = "" }: ImageWithStateProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return <img className={`${className} image-${status}`} src={src} alt={alt} onLoad={() => setStatus("loaded")} onError={() => setStatus("error")} />;
}

export type ImageViewerProps = {
  images: ImageViewerImage[];
  initialIndex?: number;
  title?: string;
  open: boolean;
  onClose: () => void;
};

function Icon({ name }: { name: "close" | "left" | "right" }) {
  const paths = {
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    left: <path d="m14 6-6 6 6 6" />,
    right: <path d="m10 6 6 6-6 6" />,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function ImageViewer({ images, initialIndex = 0, title, open, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)));
  const dialogRef = useRef<HTMLElement | null>(null);
  const currentImage = images[currentIndex] ?? images[0] ?? null;

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setCurrentIndex((index) => (index - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setCurrentIndex((index) => (index + 1) % images.length);
    };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose, open]);

  if (!open || !currentImage || images.length === 0) return null;

  const move = (direction: number) => setCurrentIndex((index) => (index + direction + images.length) % images.length);

  return <div className="lightbox-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="lightbox" ref={dialogRef} role="dialog" aria-modal="true" aria-label={title || "Imagem ampliada"} tabIndex={-1}><div className="lightbox-toolbar">{title ? <h3>{title}</h3> : <span aria-hidden="true" /> }<div className="lightbox-toolbar-actions"><span>{String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span><button className="lightbox-close" type="button" onClick={onClose} aria-label="Fechar imagem ampliada"><Icon name="close" /></button></div></div><div className="lightbox-thumbnails" aria-label="Miniaturas da galeria ampliada">{images.map((image, index) => <button className={`lightbox-thumbnail ${index === currentIndex ? "selected" : ""}`} type="button" key={image.id} onClick={() => setCurrentIndex(index)} aria-label={`Selecionar imagem ${index + 1}`} aria-current={index === currentIndex}><ImageWithState src={image.thumbnailSrc || image.src} alt="" /></button>)}</div><div className="lightbox-stage"><ImageWithState key={currentImage.id} src={currentImage.src} alt={currentImage.alt || title || "Imagem ampliada"} />{images.length > 1 && <><button className="lightbox-nav previous" type="button" onClick={() => move(-1)} aria-label="Imagem anterior"><Icon name="left" /></button><button className="lightbox-nav next" type="button" onClick={() => move(1)} aria-label="Próxima imagem"><Icon name="right" /></button></>}</div></section></div>;
}
