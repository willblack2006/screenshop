# screenshop

> Clone any ecommerce site into a running Next.js storefront — just by describing it to Claude Code.

**No API keys. No web UI. No ZIP downloads.**
Open Claude Code, describe the site, watch it build.

---

## How it works

```
You: "clone casely.com — I sell phone cases"
```

Claude Code will:

1. 📸 Screenshot the target site (desktop + mobile)
2. 🎨 Analyze the design — colors, layout, typography, mood
3. ✍️ Generate 11 source files styled to match
4. 📦 Copy boilerplate templates (cart, types, Shopify client)
5. ⚙️ Run `npm install` in the generated project
6. 🚀 Start the dev server on `localhost:3001`
7. 📷 Screenshot the result
8. 📁 Hand you a complete, running Next.js storefront

---

## Quickstart

```bash
git clone https://github.com/willblack2006/screenshop
cd screenshop
npm install
claude
```

Then in Claude Code:

```
clone casely.com — I'm selling phone cases
```

That's it. No `.env` editing. No API keys. Just Claude Code.

---

## Output

```
output/casely/              ← complete Next.js project
  src/
    app/
      page.tsx              ← homepage: hero + collections + products
      layout.tsx
      globals.css           ← extracted color palette as CSS vars
      products/[handle]/
      collections/[handle]/
      cart/
      api/cart/
    components/
      header.tsx
      footer.tsx
      product-card.tsx
      product-gallery.tsx   ← "use client"
      product-options.tsx   ← "use client"
      cart-provider.tsx
    lib/
      shopify.ts            ← mock data (swap for real Shopify any time)
      types.ts
  package.json
  next.config.ts
  tsconfig.json
  CLAUDE.md
  .env.local

screenshots/
  source-casely/
    screenshot.png          ← casely.com desktop
    screenshot-mobile.png   ← casely.com mobile
  result-casely/
    screenshot.png          ← your generated store
    screenshot-mobile.png
```

---

## Shopify (optional)

Generated stores run immediately with built-in mock data — no Shopify account needed.

When you're ready to connect a real store, open Claude Code inside the generated project and run:

```
/setup-shopify
```

Claude will walk you through getting a Storefront API token and wiring it up.

---

## Requirements

- **Node.js 18+**
- **Claude Code** (authenticated — `claude` in your terminal)
- That's it

---

## Tech stack

**This repo** (the tool):

| | |
|---|---|
| Screenshots | [Puppeteer](https://pptr.dev) |
| AI | Claude Code (you) |

**Generated storefronts:**

| | |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Data | Shopify Storefront API or built-in mock |
| Cart | In-memory mock → swappable to Shopify checkout |

---

## Project layout

```
screenshop/
├── scripts/
│   └── screenshot.mjs          ← Puppeteer: URL + dir → desktop + mobile PNGs
├── templates/                  ← boilerplate copied into every generated project
│   ├── shopify-mock.ts.template
│   ├── shopify.ts.template
│   ├── types.ts.template
│   ├── cart-provider.tsx.template
│   └── ...
├── .claude/
│   └── commands/
│       ├── clone-site.md       ← main skill (13-step workflow)
│       ├── setup-shopify.md    ← connect to real Shopify
│       └── shopify-headless.md ← advanced Shopify patterns
├── output/                     ← generated projects (gitignored)
└── screenshots/                ← source + result screenshots (gitignored)
```

---

## Commands

| Command | What it does |
|---|---|
| `clone <url> — <description>` | Clone a site into `output/<slug>/` |
| `/setup-shopify` (in generated project) | Connect to a real Shopify store |
| `/shopify-headless` (in generated project) | Build a production-grade headless store |

---

## FAQ

**Does this copy the brand?**
No. screenshop extracts the visual design — colors, layout, typography — and applies it to neutral placeholder content. No brand names, logos, or trademarked copy are used.

**Do I need a Shopify account?**
No. Generated stores work out of the box with mock product data. Shopify is optional.

**Can I deploy the generated store?**
Yes. It's a standard Next.js project. Push it to Vercel, Netlify, or anywhere that runs Node.

**Why port 3001?**
To avoid colliding with anything you might already have running on 3000.

---

## License

MIT
