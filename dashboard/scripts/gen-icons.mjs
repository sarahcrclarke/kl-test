// One-off PWA icon generator — renders a simple branded square via Chromium and
// screenshots it at each required size. Not part of the app runtime.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

function html(size, maskable) {
  const pad = maskable ? size * 0.16 : 0;
  return `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;}
    .icon{width:${size}px;height:${size}px;background:#2a78d6;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;}
    .inner{padding:${pad}px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;box-sizing:border-box;}
    .mark{color:#fff;font-weight:800;font-size:${size * 0.42}px;letter-spacing:-2px;}
  </style></head><body><div class="icon"><div class="inner"><span class="mark">KL</span></div></div></body></html>`;
}

async function main() {
  const browser = await chromium.launch(
    process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {}
  );
  const targets = [
    { file: "icon-192.png", size: 192, maskable: false },
    { file: "icon-512.png", size: 512, maskable: false },
    { file: "maskable-192.png", size: 192, maskable: true },
    { file: "maskable-512.png", size: 512, maskable: true },
  ];
  for (const t of targets) {
    const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
    await page.setContent(html(t.size, t.maskable));
    await page.screenshot({ path: path.join(OUT_DIR, t.file) });
    await page.close();
    console.log("wrote", t.file);
  }
  await browser.close();
}

main();
