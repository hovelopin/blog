import Link from "next/link";
import { LOCALE_META, localePath, type Locale } from "@/lib/locale";

interface PostLocaleSwitchProps {
  slug: string;
  /** 지금 보고 있는 언어 */
  current: Locale;
  /** 넘어갈 수 있는 언어. 번역본이 있을 때만 넘겨준다. */
  other: Locale;
}

/**
 * 글 안에서 같은 글의 다른 언어판으로 넘어가는 링크.
 *
 * 전역 네비게이션에는 두지 않는다. 번역은 글 단위로만 존재하므로
 * "이 글의 다른 언어판"이라는 맥락이 있는 자리에서만 의미가 있다.
 */
export function PostLocaleSwitch({ slug, current, other }: PostLocaleSwitchProps) {
  const label = LOCALE_META[other].label;
  return (
    <Link
      href={localePath(other, `/posts/${slug}`)}
      hrefLang={LOCALE_META[other].lang}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      <span aria-hidden="true">🌐</span>
      {current === "ko" ? `Read in ${label}` : `${label}로 읽기`}
    </Link>
  );
}
