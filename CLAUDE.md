THIS FILE IS BINDING.

screenshop is a Claude Code project. There is no web UI. Claude Code IS the AI.

## What this project does

When a user says "clone casely.com — I sell phone cases", Claude Code:
1. Screenshots the target site with Puppeteer
2. Reads the screenshot and analyzes the design
3. Generates a complete Next.js storefront in `output/<slug>/`
4. Copies boilerplate templates from `templates/`
5. Runs `npm install` and starts the dev server
6. Screenshots the result
7. Reports back with paths to the project and screenshots

## How to invoke

Use the `/clone-site` command or just describe the site you want to clone:
> "clone casely.com — I'm selling phone cases"

## Project layout

- `scripts/screenshot.mjs` — Puppeteer: takes URL + output dir, saves PNGs
- `templates/` — boilerplate files copied into every generated project
- `.claude/commands/clone-site.md` — the main skill
- `.claude/commands/setup-shopify.md` — connect a generated store to real Shopify
- `.claude/commands/shopify-headless.md` — advanced Shopify headless patterns
- `output/` — generated projects land here (gitignored)
- `screenshots/` — source + result screenshots (gitignored)

## Rules

- Do not run `npm install` or `npm run dev` in this root directory — only in `output/<slug>/`
- Do not modify files in `templates/` unless fixing a bug in the boilerplate
- Do not add features not described in this file or the skill documents
- Shopify is optional — generated stores work immediately with mock data
