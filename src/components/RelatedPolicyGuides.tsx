import Link from 'next/link';
import { guideMatchesPolicy, policyGuides } from '@/lib/policyGuides';
import { localizedPublicPath, type PublicLanguage } from '@/lib/seo';

export default function RelatedPolicyGuides({ policy, lang = 'en' }: {
  policy: { id: string; type: string; name: string; company: { slug: string } };
  lang?: PublicLanguage;
}) {
  const guides = policyGuides.filter((guide) => guideMatchesPolicy(guide, policy));
  if (!guides.length) return null;
  return <nav aria-label={lang === 'it' ? 'Guide per questa policy' : 'Guides for this policy'}>
    <h2>{lang === 'it' ? 'Come leggere questa policy' : 'How to read this policy'}</h2>
    <ul>{guides.map((guide) => <li key={guide.slug}>
      <Link href={localizedPublicPath(`/guides/${guide.slug}`, lang)}>{guide.copy[lang].title}</Link>
    </li>)}</ul>
  </nav>;
}
