'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { publicRequestLanguage } from '@/lib/seo';

/** The root layout persists across client navigation; keep its language tied to the URL. */
export default function DocumentLanguage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = publicRequestLanguage(pathname || '/', searchParams.get('lang'));
  useEffect(() => {
    // The home and workspace share live browser/onboarding state, including URL updates.
    if (pathname !== '/') document.documentElement.lang = lang;
  }, [lang, pathname]);
  return null;
}
