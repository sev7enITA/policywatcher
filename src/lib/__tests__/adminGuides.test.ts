import { describe, expect, it } from 'vitest';
import { ADMIN_GUIDES, ADMIN_GUIDE_ROUTES, getAdminGuide } from '../adminGuides';

describe('admin page guides', () => {
  it('covers every visible admin navigation route with complete content', () => {
    expect(Object.keys(ADMIN_GUIDES).sort()).toEqual([...ADMIN_GUIDE_ROUTES].sort());
    for (const route of ADMIN_GUIDE_ROUTES) {
      const guide = ADMIN_GUIDES[route];
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.purpose.length).toBeGreaterThan(20);
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
      expect(guide.steps.length).toBeLessThanOrEqual(5);
      expect(guide.keyTerms.length).toBeGreaterThan(0);
      expect(guide.commonMistake.length).toBeGreaterThan(20);
    }
  });

  it('uses the most specific route and excludes login', () => {
    expect(getAdminGuide('/admin/cron')?.title).toBe('Cron Manager');
    expect(getAdminGuide('/admin/companies/example')?.title).toBe('Companies');
    expect(getAdminGuide('/admin/login')).toBeNull();
  });
});
