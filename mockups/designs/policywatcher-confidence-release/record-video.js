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
const exportsDir = path.join(root, "exports");

async function record() {
  await fs.mkdir(exportsDir, { recursive: true });
  await fs.rm(path.join(exportsDir, "policywatcher-confidence-release.webm"), {
    force: true,
  });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: exportsDir,
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForTimeout(7600);

  const video = page.video();
  await context.close();
  const finalVideoPath = path.join(exportsDir, "policywatcher-confidence-release.webm");
  const generatedVideoPath = await video.path();
  await video.saveAs(finalVideoPath);
  if (generatedVideoPath !== finalVideoPath) {
    await fs.rm(generatedVideoPath, { force: true });
  }
  await browser.close();
}

record().catch((error) => {
  console.error(error);
  process.exit(1);
});
