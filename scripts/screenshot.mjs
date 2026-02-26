#!/usr/bin/env node
import puppeteer from "puppeteer";
import { mkdir, access } from "fs/promises";
import { resolve } from "path";

const [, , url, outputDir, label] = process.argv;

if (!url || !outputDir) {
  console.error("Usage: node scripts/screenshot.mjs <url> <output-dir> [label]");
  console.error("  label examples: draft, polished, polished2");
  console.error("  No label → screenshot.png (source screenshots)");
  process.exit(1);
}

const absOutputDir = resolve(outputDir);
await mkdir(absOutputDir, { recursive: true });

// Build filenames.
// With label:    screenshot-draft.png / screenshot-draft-mobile.png
// Without label: screenshot.png       / screenshot-mobile.png  (source screenshots)
const suffix = label ? `-${label}` : "";
const desktopFilename = `screenshot${suffix}.png`;
const mobileFilename  = `screenshot${suffix}-mobile.png`;

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--ignore-certificate-errors"],
});

try {
  // Desktop — 1440×900
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });
  await desktopPage.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  const desktopPath = resolve(absOutputDir, desktopFilename);
  await desktopPage.screenshot({ path: desktopPath, fullPage: true });
  console.log(desktopPath);

  // Mobile — 390×844 (iPhone 14 Pro)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 });
  await mobilePage.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  const mobilePath = resolve(absOutputDir, mobileFilename);
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log(mobilePath);
} finally {
  await browser.close();
}
