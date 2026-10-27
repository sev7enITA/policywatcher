import { serializeJsonLd } from '@/lib/structuredData';
import Link from 'next/link';
import { breadcrumbData } from '@/lib/seo';

export default function PublicBreadcrumbs({ items, lang = 'en' }: {
  items: Array<{ name: string; path: string }>;
  lang?: 'en' | 'it';
}) {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbData(items)) }} />
    <nav aria-label={lang === 'it' ? 'Percorso di navigazione' : 'Breadcrumb'} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
      {items.map((item, index) => <span key={item.path}>
        {index > 0 && <span aria-hidden="true"> / </span>}
        {index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}
      </span>)}
    </nav>
  </>;
}
