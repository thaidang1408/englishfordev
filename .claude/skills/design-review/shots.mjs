// Chụp ảnh màn hình để kiểm giao diện.
// Dùng: node shots.mjs http://localhost:4321 / /bang-gia /hoc/hom-qua-da-lam-gi
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [base, ...paths] = process.argv.slice(2);
if (!base || paths.length === 0) {
  console.error("Dùng: node shots.mjs <url gốc> <đường dẫn> [đường dẫn...]");
  process.exit(1);
}
const out = ".design-shots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const path of paths) {
  for (const width of [375, 1280]) {
    for (const scheme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme });
      await page.goto(new URL(path, base).href, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      const name = `${path.replace(/[^a-z0-9]+/gi, "_") || "_home"}-${width}-${scheme}.png`;
      await page.screenshot({ path: `${out}/${name}`, fullPage: true });
      console.log(`${name}${overflow ? "  ← CUỘN NGANG" : ""}`);
      await page.close();
    }
  }
}
await browser.close();
