import { Link } from "@/components/link";
import { Thumbnail } from "@/components/post-card";
import { cn } from "@/lib/utils";
import type { PostSummary } from "@/types/content";

interface ArticleListProps {
  posts: PostSummary[];
  className?: string;
}

/**
 * 홈의 최신 글 목록. 날짜 · 제목과 요약 · 썸네일을 한 줄에 놓고 행 사이를 선으로 나눈다.
 *
 * 크기와 서체는 kciter.so 의 목록을 기준으로 맞췄다 — 날짜 13px Courier New,
 * 제목 16px/600, 요약 13px 두 줄, 썸네일 112×70.
 * 좁은 화면에서는 날짜를 제목 위로 올리고 썸네일을 오른쪽에 붙인다.
 * 날짜는 frontmatter 의 `YYYY-MM-DD` 를 그대로 쓴다 — 날짜 열의 폭을 고정하기 위해서다.
 */
export function ArticleList({ posts, className }: ArticleListProps) {
  return (
    <ul className={cn("border-t border-border/70", className)}>
      {posts.map((post, i) => (
        <li key={post.slug} className="border-b border-border/70">
          <Link
            href={`/articles/${post.slug}`}
            className="group grid grid-cols-[1fr_96px] items-center gap-x-4 gap-y-0.5 px-1 py-4 sm:grid-cols-[6.75rem_1fr_112px] sm:gap-x-5"
          >
            <time
              dateTime={post.date}
              className="col-span-2 font-['Courier_New',monospace] text-[13px] leading-7 tracking-[0.5px] text-muted-foreground/80 sm:col-span-1"
            >
              {post.date}
            </time>

            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[16px] font-semibold leading-[1.45] text-foreground/85 transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              {/* 부제(description) 대신 본문 첫머리를 두 줄까지 보여주고 말줄임표로 끊는다. */}
              <p className="mt-1 line-clamp-2 text-[13px] leading-[1.55] text-muted-foreground">
                {post.excerpt}
              </p>
            </div>

            <div className="relative aspect-[112/70] w-full overflow-hidden rounded-lg bg-muted/40 shadow-[0_1px_2px_0_rgba(0,0,0,0.06),0_8px_18px_-12px_rgba(69,79,91,0.4)]">
              <Thumbnail
                post={post}
                sizes="112px"
                // 첫 행은 홈의 LCP 후보라 미루지 않는다.
                priority={i === 0}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
