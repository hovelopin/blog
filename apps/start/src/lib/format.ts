// 날짜 표기는 사이트 전체에서 "Jul 20, 2026" 한 가지로 통일한다.
// frontmatter 의 날짜는 "2026-07-20" 같은 날짜만 있는 문자열이라 UTC 자정으로 파싱된다.
// timeZone 을 UTC 로 고정하지 않으면 서버(UTC)와 브라우저(KST)가 서로 다른 날을 찍어
// 하루 밀린 날짜나 hydration 불일치가 생긴다.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "2026-07-20" → "Jul 20, 2026" */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return DATE_FORMAT.format(d);
}

/** "2026-07" → "Jul 2026" (다이어리 월 필터처럼 일 단위가 없는 자리) */
export function formatMonth(isoMonth: string): string {
  const d = new Date(`${isoMonth}-01`);
  if (Number.isNaN(d.getTime())) return isoMonth;
  return MONTH_FORMAT.format(d);
}

