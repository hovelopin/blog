import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

/**
 * 글 조회수. Upstash Redis 에 저장한다.
 *
 * - `views:<slug>`           누적 조회수
 * - `seen:<slug>:<해시>`     최근 본 사람 표시. TTL 이 지나면 다시 셀 수 있다.
 *
 * 환경변수가 없으면 조용히 비활성화된다. 조회수는 글의 부가 정보라
 * 설정이 빠졌다고 페이지가 깨지면 안 된다.
 */

/** 같은 사람을 다시 세지 않는 기간. */
const SEEN_TTL_SECONDS = 60 * 60 * 24;

/**
 * 프로덕션이 아닌 곳(로컬, Vercel 프리뷰)은 키를 분리한다.
 * 같은 Upstash DB 를 봐도 실제 조회수가 오염되지 않는다.
 */
const KEY_PREFIX = process.env.VERCEL_ENV === "production" ? "" : "dev:";

let client: Redis | null = null;

function getClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client ??= new Redis({ url, token });
  return client;
}

/** 조회수 기능을 쓸 수 있는 상태인지. */
export function isViewCountEnabled(): boolean {
  return getClient() !== null;
}

/**
 * 방문자를 식별할 값. 원본 IP 는 저장하지 않는다.
 * 슬러그를 섞어서 글마다 다른 해시가 나오게 한다.
 */
function visitorHash(slug: string, ip: string, userAgent: string): string {
  return createHash("sha256").update(`${slug}|${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

/**
 * 조회를 기록하고 최신 조회수를 돌려준다.
 * TTL 안에 이미 본 사람이면 올리지 않고 현재 값만 읽는다.
 */
export async function recordView(
  slug: string,
  ip: string,
  userAgent: string,
): Promise<number | null> {
  const redis = getClient();
  if (!redis) return null;

  const viewsKey = `${KEY_PREFIX}views:${slug}`;
  const seenKey = `${KEY_PREFIX}seen:${slug}:${visitorHash(slug, ip, userAgent)}`;

  // NX 라서 처음 보는 사람일 때만 성공한다. 성공 여부가 곧 "새 조회"다.
  const isFirstVisit = await redis.set(seenKey, 1, { nx: true, ex: SEEN_TTL_SECONDS });
  if (isFirstVisit) return redis.incr(viewsKey);

  const current = await redis.get<number>(viewsKey);
  return current ?? 0;
}
