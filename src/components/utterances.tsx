'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function Utterances() {
  const utterancesRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://utteranc.es/client.js';
    scriptElement.async = true;
    scriptElement.crossOrigin = 'anonymous';
    scriptElement.setAttribute('repo', 'hovelopin/blog');
    scriptElement.setAttribute('issue-term', 'og:title');
    scriptElement.setAttribute('theme', 'github-light');

    utterancesRef.current?.appendChild(scriptElement);

    return () => {
      utterancesRef.current?.removeChild(scriptElement);
    };
  }, [pathname]);

  return <div ref={utterancesRef} className="mt-10" />;
}
