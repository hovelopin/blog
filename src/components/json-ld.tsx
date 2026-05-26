type JsonLdData = Record<string, unknown>;

interface JsonLdProps {
  data: JsonLdData | JsonLdData[];
}

/**
 * schema.org 구조화 데이터를 <script type="application/ld+json">로 렌더한다.
 * 검색엔진과 AI 답변엔진(GEO)이 글의 제목/작성자/날짜를 정확히 파싱하게 한다.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // </script> 주입 방지를 위해 < 를 이스케이프한다.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
