"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ImageAvailabilityStatus } from "@/utils/api/contracts";
import { resolveMediaUrl } from "@/utils/api/product-images";
import { diagnoseImageLoadFailure } from "@/utils/api/product-images";
import {
  imageAvailabilityView,
  type ImageAvailabilityView,
} from "@/utils/display/image-availability";

export type ImageViewerImage = {
  id: string;
  src: string;
  thumbnailSrc?: string;
  alt?: string;
  availabilityStatus?: ImageAvailabilityStatus;
  retryable?: boolean;
  warningCode?: string | null;
};

type ImageWithStateProps = {
  src: string;
  alt: string;
  className?: string;
  availabilityStatus?: ImageAvailabilityStatus;
  retryable?: boolean;
  warningCode?: string | null;
  showFallbackLabel?: boolean;
  allowRetry?: boolean;
  onImageError?: () => void;
  onImageFailure?: (failure: ImageAvailabilityView) => void;
};

export function ImageWithState({
  src,
  alt,
  className = "",
  availabilityStatus,
  retryable = false,
  warningCode,
  showFallbackLabel = true,
  allowRetry = true,
  onImageError,
  onImageFailure,
}: ImageWithStateProps) {
  const resolvedSrc = useMemo(() => resolveMediaUrl(src) || "", [src]);
  const [attempt, setAttempt] = useState(0);
  const [renderState, setRenderState] = useState<{
    src: string;
    attempt: number;
    status: "loading" | "loaded" | "error";
    failure: ImageAvailabilityView | null;
  } | null>(null);
  const isDiagnosing = useRef(false);
  const diagnosisId = useRef(0);
  const activeSrc = useRef(resolvedSrc);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isCurrentRender = renderState?.src === resolvedSrc && renderState.attempt === attempt;
  const status = isCurrentRender ? renderState.status : resolvedSrc ? "loading" : "error";
  const failure = isCurrentRender ? renderState.failure : null;

  const handleError = useCallback(() => {
    setRenderState({ src: resolvedSrc, attempt, status: "error", failure: imageAvailabilityView("load_failed") });
    onImageError?.();
    if (isDiagnosing.current) return;
    isDiagnosing.current = true;
    const currentDiagnosis = ++diagnosisId.current;
    const failedSrc = resolvedSrc;
    void diagnoseImageLoadFailure(resolvedSrc).then((result) => {
      if (diagnosisId.current !== currentDiagnosis || activeSrc.current !== failedSrc) return;
      setRenderState({ src: failedSrc, attempt, status: "error", failure: result });
      onImageFailure?.(result);
    }).finally(() => {
      if (diagnosisId.current === currentDiagnosis) isDiagnosing.current = false;
    });
  }, [attempt, onImageError, onImageFailure, resolvedSrc]);

  useLayoutEffect(() => {
    activeSrc.current = resolvedSrc;
    diagnosisId.current += 1;
    isDiagnosing.current = false;
  }, [resolvedSrc]);

  const currentFailure = failure ?? imageAvailabilityView(
    availabilityStatus && availabilityStatus !== "ready"
      ? availabilityStatus
      : resolvedSrc ? "load_failed" : "missing",
    retryable,
  );
  const imageStatus = resolvedSrc ? status : "error";

  return (
    <span
      className={`media-image ${className} image-${imageStatus}`}
      aria-busy={status === "loading"}
    >
      {resolvedSrc && status !== "error" && (
        <img
          key={`${resolvedSrc}:${attempt}`}
          ref={imgRef}
          className={`image-${status}`}
          src={resolvedSrc}
          alt={alt}
          onLoad={() => {
            setRenderState({ src: resolvedSrc, attempt, status: "loaded", failure: null });
          }}
          onError={handleError}
        />
      )}
      {imageStatus === "loading" && <span className="media-skeleton" aria-hidden="true" />}
      {imageStatus === "error" && (
        <span
          className="media-error"
          role="status"
          aria-label={currentFailure.message}
          title={currentFailure.message}
        >
          <span className="media-empty-badge" aria-hidden="true"><Icon name="image" /></span>
          {showFallbackLabel && <span className="media-empty-label">{currentFailure.message}</span>}
          {allowRetry && currentFailure.retryable && (
            <button
              className="image-retry-button"
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setAttempt((current) => current + 1);
              }}
            >
              Tentar novamente
            </button>
          )}
        </span>
      )}
      {status === "loaded" && warningCode === "conversion_failed" && (
        <span
          className="media-warning-marker"
          role="img"
          aria-label="A versão otimizada não pôde ser gerada; a imagem original está sendo exibida."
          title="A versão otimizada não pôde ser gerada; a imagem original está sendo exibida."
        >!</span>
      )}
    </span>
  );
}

export type ImageViewerProps = {
  images: ImageViewerImage[];
  initialIndex?: number;
  title?: string;
  open: boolean;
  onClose: () => void;
};

function Icon({ name }: { name: "close" | "left" | "right" | "image" }) {
  const paths = {
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    left: <path d="m14 6-6 6 6 6" />,
    right: <path d="m10 6 6 6-6 6" />,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
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

  return <div className="lightbox-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="lightbox" ref={dialogRef} role="dialog" aria-modal="true" aria-label={title || "Imagem ampliada"} tabIndex={-1}><div className="lightbox-toolbar">{title ? <h3>{title}</h3> : <span aria-hidden="true" /> }<div className="lightbox-toolbar-actions"><span>{String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span><button className="lightbox-close" type="button" onClick={onClose} aria-label="Fechar imagem ampliada"><Icon name="close" /></button></div></div><div className="lightbox-thumbnails" aria-label="Miniaturas da galeria ampliada">{images.map((image, index) => <button className={`lightbox-thumbnail ${index === currentIndex ? "selected" : ""}`} type="button" key={image.id} onClick={() => setCurrentIndex(index)} aria-label={`Selecionar imagem ${index + 1}`} aria-current={index === currentIndex}><ImageWithState src={image.thumbnailSrc || image.src} alt="" availabilityStatus={image.availabilityStatus} retryable={image.retryable} warningCode={image.warningCode} showFallbackLabel={false} allowRetry={false} /></button>)}</div><div className="lightbox-stage"><ImageWithState key={currentImage.id} src={currentImage.src} alt={currentImage.alt || title || "Imagem ampliada"} availabilityStatus={currentImage.availabilityStatus} retryable={currentImage.retryable} warningCode={currentImage.warningCode} />{images.length > 1 && <><button className="lightbox-nav previous" type="button" onClick={() => move(-1)} aria-label="Imagem anterior"><Icon name="left" /></button><button className="lightbox-nav next" type="button" onClick={() => move(1)} aria-label="Próxima imagem"><Icon name="right" /></button></>}</div></section></div>;
}
