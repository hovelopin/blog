"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  /** 열려 있는 이미지의 인덱스. null 이면 닫힌 상태. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * 본문 이미지를 전체 화면으로 띄우는 라이트박스.
 * 처음에는 화면에 맞춰 보여주고(fit), 이미지를 다시 누르면 원본 크기(1:1)로 확대한다.
 * 원본이 화면보다 작으면 확대할 것이 없으므로 fit 상태만 유지한다.
 */
/**
 * 라이트박스 안에서 이미지 한 장을 보여주는 영역.
 * 확대 상태는 이 컴포넌트가 들고 있고, 상위에서 index 를 key 로 넘겨
 * 이미지가 바뀔 때마다 새로 마운트되며 확대·스크롤이 초기화된다.
 */
function LightboxImageView({
  image,
  onClose,
}: {
  image: LightboxImage;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [zoomable, setZoomable] = useState(false);

  return (
    <div
      onClick={(e) => {
        // 이미지 바깥(여백)을 누르면 닫는다.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "relative flex-1 p-4",
        zoomed
          ? "overflow-auto"
          : "flex items-center justify-center overflow-hidden",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        onLoad={(e) => {
          const el = e.currentTarget;
          // 원본이 표시 크기보다 클 때만 확대를 허용한다.
          setZoomable(
            el.naturalWidth > el.clientWidth ||
              el.naturalHeight > el.clientHeight,
          );
        }}
        onClick={() => {
          if (zoomable) setZoomed((z) => !z);
        }}
        className={cn(
          "mx-auto rounded-lg bg-white/5",
          zoomed
            ? "w-auto max-w-none cursor-zoom-out"
            : "max-h-full max-w-full object-contain",
          !zoomed && zoomable && "cursor-zoom-in",
        )}
        draggable={false}
      />
    </div>
  );
}

export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: ImageLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const open = index !== null;
  const current = open ? images[index] : null;
  const hasMany = images.length > 1;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      const next = (index + delta + images.length) % images.length;
      onIndexChange(next);
    },
    [index, images.length, onIndexChange],
  );

  // 열려 있는 동안 배경 스크롤을 막는다.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight" && hasMany) {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" && hasMany) {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Tab") {
        // 포커스가 라이트박스 밖으로 새지 않게 가둔다.
        const focusables =
          dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hasMany, go, onClose]);

  if (!open || !current) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={current.alt || "확대한 이미지"}
      className="fixed inset-0 z-[110] flex flex-col"
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-zoom-out bg-black/85 backdrop-blur-sm"
      />

      <div className="relative flex items-center justify-between gap-3 px-4 py-3 text-white/70">
        <span className="min-w-0 truncate text-xs">
          {hasMany ? `${index + 1} / ${images.length}` : ""}
          {hasMany && current.alt ? " · " : ""}
          {current.alt}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className={cn(
            "shrink-0 rounded-md border border-white/15 bg-white/5 p-1.5",
            "text-white/80 transition-colors hover:bg-white/15 hover:text-white",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60",
          )}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <LightboxImageView key={index} image={current} onClose={onClose} />

      {hasMany && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="이전 이미지"
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 rounded-full",
              "border border-white/15 bg-black/50 p-2 text-white/80",
              "transition-colors hover:bg-black/80 hover:text-white",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60",
            )}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="다음 이미지"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 rounded-full",
              "border border-white/15 bg-black/50 p-2 text-white/80",
              "transition-colors hover:bg-black/80 hover:text-white",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60",
            )}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
