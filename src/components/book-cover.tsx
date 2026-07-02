import { cn } from "@/lib/utils";
import type { BookSummary } from "@/types/content";

// 표지 이미지 없이 slug 해시로 배정하는 책등 색 팔레트.
// (from → to 세로 그라디언트, 밝은 글자 기준으로 고른 진한 색)
const PALETTES: { from: string; to: string; ink: string }[] = [
  { from: "#1e3a8a", to: "#0b1120", ink: "#dbeafe" }, // deep blue
  { from: "#4c1d95", to: "#1e1b4b", ink: "#ede9fe" }, // violet
  { from: "#7f1d1d", to: "#3b0a0a", ink: "#fee2e2" }, // crimson
  { from: "#065f46", to: "#022c22", ink: "#d1fae5" }, // emerald
  { from: "#7c2d12", to: "#3b1006", ink: "#ffedd5" }, // amber-brown
  { from: "#0c4a6e", to: "#082f49", ink: "#e0f2fe" }, // sky
  { from: "#9d174d", to: "#4a0523", ink: "#fce7f3" }, // magenta
  { from: "#334155", to: "#0f172a", ink: "#e2e8f0" }, // slate
  { from: "#115e59", to: "#042f2e", ink: "#ccfbf1" }, // teal
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function paletteFor(book: BookSummary) {
  return PALETTES[hashString(book.slug) % PALETTES.length];
}

interface BookCoverProps {
  book: BookSummary;
  /** 표지 크기. shelf=책장 그리드, hero=상세 상단 큰 표지 */
  size?: "shelf" | "hero";
  className?: string;
}

/**
 * 이미지 없이 CSS로 그리는 "세워진 책" 표지.
 * 오른쪽에 책배(page fore-edge) 층과 아래 그림자로 입체감을 준다.
 */
export function BookCover({ book, size = "shelf", className }: BookCoverProps) {
  const palette = paletteFor(book);
  const from = book.color ?? palette.from;
  const to = book.color ? book.color : palette.to;
  const ink = palette.ink;
  const hero = size === "hero";

  return (
    <div
      className={cn(
        "group/book relative w-full [perspective:1400px]",
        className,
      )}
    >
      {/* 책배: 표지 뒤에서 오른쪽·아래로 살짝 삐져나온 책장(페이지) 더미 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-[6px] translate-y-[5px] rounded-l-[2px] rounded-r-[3px] bg-neutral-200 shadow-[0_10px_20px_-8px_rgba(0,0,0,0.55)] [background:repeating-linear-gradient(90deg,#d9d9d9_0px,#d9d9d9_1px,#fafafa_1px,#fafafa_3px)]"
      />

      {/* 표지 본체 */}
      <div
        className={cn(
          "relative flex aspect-[3/4.15] flex-col overflow-hidden rounded-l-[3px] rounded-r-[5px]",
          "shadow-[0_2px_10px_-2px_rgba(0,0,0,0.4)] ring-1 ring-black/20",
          "origin-left transition-transform duration-500 ease-out",
          hero
            ? "p-4"
            : "p-3 group-hover/book:[transform:rotateY(-16deg)_translateZ(6px)] sm:p-3.5",
        )}
        style={{
          backgroundImage: `linear-gradient(160deg, ${from}, ${to})`,
          color: ink,
        }}
      >
        {/* 실제 표지 이미지가 있으면 채운다 */}
        {book.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImage}
            alt={`${book.title} 표지`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* 책등 접힘: 왼쪽 세로 음영 + 하이라이트 라인 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[9%] bg-gradient-to-r from-black/35 via-black/10 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[9%] w-px bg-white/15"
        />
        {/* 표지 전체 광택 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20"
        />

        {/* 이미지 표지가 없을 때만 텍스트로 표지를 구성한다 */}
        {!book.coverImage && (
          <>
            {/* 상단 키커: 첫 태그 또는 OPEN SOURCE */}
            <p
              className={cn(
                "relative z-10 font-mono uppercase tracking-[0.18em] opacity-70",
                hero ? "text-[10px]" : "text-[8px] sm:text-[9px]",
              )}
            >
              {book.tags?.[0] ?? "open source"}
            </p>

            {/* 제목 */}
            <h3
              className={cn(
                "relative z-10 mt-auto break-keep font-serif font-semibold leading-[1.1] tracking-tight",
                hero ? "text-2xl" : "text-[15px] sm:text-lg",
              )}
            >
              {book.title}
            </h3>

            {/* 저자(repo) + 챕터 수 */}
            <div
              className={cn(
                "relative z-10 mt-2 flex items-end justify-between gap-2 border-t border-white/20 pt-2 font-mono opacity-80",
                hero ? "text-[10px]" : "text-[8px] sm:text-[9px]",
              )}
            >
              <span className="truncate">{book.repo ?? "hovelopin"}</span>
              <span className="shrink-0 tabular-nums">
                {book.chapters.length}ch
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
