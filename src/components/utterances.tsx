'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function Utterances() {
  const utterancesRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!utterancesRef.current) return;

    // 기존 utterances 엘리먼트 제거
    const utterancesElement = utterancesRef.current.querySelector('.utterances');
    if (utterancesElement) {
      utterancesElement.remove();
    }

    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://utteranc.es/client.js';
    scriptElement.async = true;
    scriptElement.crossOrigin = 'anonymous';
    scriptElement.setAttribute('repo', 'hovelopin/blog');
    scriptElement.setAttribute('issue-term', 'pathname');
    scriptElement.setAttribute('theme', 'github-light');

    utterancesRef.current.appendChild(scriptElement);
  }, [pathname]);

  return <div ref={utterancesRef} className="mt-10" />;
}
