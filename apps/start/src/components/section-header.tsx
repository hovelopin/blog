import { Link } from "@/components/link";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  /** 오른쪽 "ALL … →" 링크 */
  more?: { href: string; label: string };
  className?: string;
}

/**
 * 홈 섹션 머리말. kciter.so 의 섹션 제목(13px/700, 자간 2px, 대문자)과
 * "ALL … →" 링크(모노 11px, 대문자)를 기준으로 맞췄다.
 */
export function SectionHeader({ title, more, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3.5 flex items-baseline justify-between gap-4", className)}>
      <h2 className="text-[13px] font-bold uppercase leading-[1.4] tracking-[2px] text-muted-foreground/80">
        {title}
      </h2>
      {more && (
        <Link
          href={more.href}
          className="shrink-0 font-mono text-[11px] uppercase leading-7 tracking-[0.04em] text-muted-foreground/70 transition-colors hover:text-primary"
        >
          {more.label} →
        </Link>
      )}
    </div>
  );
}
