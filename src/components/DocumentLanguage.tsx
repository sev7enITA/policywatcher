'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { publicRequestLanguage } from '@/lib/seo';

/** The root layout persists across client navigation; keep its language tied to the URL. */
export default function DocumentLanguage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = publicRequestLanguage(pathname || '/', searchParams.get('lang'));
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return null;
}
