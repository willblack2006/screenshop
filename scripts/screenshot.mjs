#!/usr/bin/env node
import puppeteer from "puppeteer";
import { mkdir } from "fs/promises";
import { resolve } from "path";

const [, , url, outputDir] = process.argv;

if (!url || !outputDir) {
  console.error("Usage: node scripts/screenshot.mjs <url> <output-dir>");
  process.exit(1);
}

const absOutputDir = resolve(outputDir);
await mkdir(absOutputDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--ignore-certificate-errors"],
});

try {
  // Desktop screenshot — 1440×900
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });

  await desktopPage.goto(url, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  const desktopPath = resolve(absOutputDir, "screenshot.png");
  await desktopPage.screenshot({ path: desktopPath, fullPage: true });
  console.log(desktopPath);

  // Mobile screenshot — 390×844 (iPhone 14 Pro)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 });

  await mobilePage.goto(url, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  const mobilePath = resolve(absOutputDir, "screenshot-mobile.png");
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log(mobilePath);
} finally {
  await browser.close();
}
