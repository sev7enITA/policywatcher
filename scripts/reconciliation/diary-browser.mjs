import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Run on a deployed candidate, or a local production build, before promotion.
const origin = new URL(process.argv[2]).origin;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
try {
  for (const lang of ['it', 'en']) {
    for (const width of [390, 1366]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        const suffix = lang === 'it' ? '?lang=it' : '';
        await page.goto(origin + '/' + suffix, { waitUntil: 'domcontentloaded' });
        const link = page.getByRole('link', { name: lang === 'it' ? 'Leggi il diario in italiano' : 'Read the latest findings', exact: true });
        const target = origin + '/engine-6-preview' + suffix + '#validation';
        await Promise.all([page.waitForURL(target), link.click()]);
        assert.equal(await page.locator('html').getAttribute('lang'), lang);
        const receipts = page.getByRole('navigation', { name: lang === 'it' ? 'Ricevute di verifica' : 'Verification receipts' }).getByRole('link');
        await receipts.first().waitFor({ state: 'visible' });
        await page.waitForFunction(() => {
          const first = document.querySelector('#validation nav li a');
          return first && getComputedStyle(first).display === 'flex';
        });
        const boxes = await receipts.evaluateAll(elements => elements.map(el => {
          const { top, bottom, height } = el.getBoundingClientRect();
          return { top, bottom, height };
        }));
        assert.ok(boxes.length >= 5);
        assert.ok(boxes.every((box, i) => box.height >= 44 && (!i || box.top >= boxes[i - 1].bottom)));
        await receipts.first().focus();
        await page.keyboard.press('Tab');
        assert.ok(await receipts.nth(1).evaluate(el => document.activeElement === el && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        console.log(JSON.stringify({ target, lang, width, receipts: boxes.length, minimumHeight: Math.min(...boxes.map(box => box.height)), keyboardFocus: true }));
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
