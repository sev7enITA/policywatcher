const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function loadChromium() {
  const candidates = [
    () => require("@playwright/test").chromium,
    () => require("playwright").chromium,
    () =>
      require("/Users/fabriziodegni/.agents/skills/playwright/node_modules/playwright")
        .chromium,
  ];

  for (const candidate of candidates) {
    try {
      return candidate();
    } catch {
      // Try the next available runtime without changing app dependencies.
    }
  }

  throw new Error("Playwright runtime not found.");
}

const chromium = loadChromium();
const root = __dirname;
const htmlPath = path.join(root, "index.html");
const framesDir = path.join(root, "frames");
const exportsDir = path.join(root, "exports");

async function cleanFrames() {
  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });
  await fs.mkdir(exportsDir, { recursive: true });
}

async function capture() {
  await cleanFrames();

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(exportsDir, "policywatcher-confidence-release-poster.png"),
    fullPage: false,
  });

  const frameCount = 96;
  const frameDelayMs = 1000 / 16;

  for (let index = 0; index < frameCount; index += 1) {
    await page.screenshot({
      path: path.join(framesDir, `frame-${String(index + 1).padStart(4, "0")}.png`),
      fullPage: false,
    });
    await page.waitForTimeout(frameDelayMs);
  }

  await browser.close();
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
