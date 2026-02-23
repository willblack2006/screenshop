# screenshop

Turn any ecommerce screenshot into a production-ready Shopify storefront using Claude AI.

## What it does

Upload 1–5 screenshots of any ecommerce website. screenshop uses Claude's vision API to analyze the design — extracting colors, typography, layout, and spacing — then generates a complete Next.js + Shopify storefront that matches the visual style, ready to run in minutes.

## How it works

1. **Screenshots** → Claude vision API analyzes design, extracts color palette, layout, and typography
2. **Claude outputs** a complete Next.js App Router project (11 files) as structured JSON
3. **Merge** — Claude's UI code is merged with pre-built Shopify Storefront API boilerplate
4. **Download** a ZIP that runs immediately with `npm install && npm run dev`

## Setup

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)
- A Shopify store with [Storefront API access](https://shopify.dev/docs/api/storefront)

### Install

```bash
git clone https://github.com/[USERNAME]/screenshop
cd screenshop
cp .env.example .env.local
# Fill in .env.local with your keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | From [console.anthropic.com](https://console.anthropic.com) |
| `SHOPIFY_STORE_DOMAIN` | e.g. `your-store.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | From Shopify Partner Dashboard → Storefront API |

Credentials never touch the browser. They stay in `.env.local` on the server only.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/[USERNAME]/screenshop)

Add the three environment variables in your Vercel project settings.

## Generated Output

Each downloaded ZIP is a complete Next.js 15 project:

```
my-store/
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← homepage (hero + collections + products)
│   │   ├── products/[handle]/page.tsx
│   │   ├── collections/[handle]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/cart/route.ts
│   ├── components/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── product-card.tsx
│   │   ├── product-gallery.tsx
│   │   ├── product-options.tsx
│   │   └── cart-provider.tsx
│   └── lib/
│       ├── shopify.ts                ← Storefront API GraphQL client
│       └── types.ts
├── .env.local                        ← your Shopify creds, pre-filled
├── CLAUDE.md                         ← rules for Claude Code
├── next.config.ts
└── package.json
```

The generated store:
- Pulls real products and collections from your Shopify Storefront API
- Handles cart state and redirects to Shopify's native checkout
- Is styled to match your screenshot's design language

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router, server components by default)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Anthropic claude-sonnet-4-5](https://docs.anthropic.com) (vision API)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront) (GraphQL)
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) — in-browser code preview
- [jszip](https://stuk.github.io/jszip/) — ZIP assembly

## What this is NOT

- Not a SaaS. No accounts, no payments, no database.
- Not a consumer product. It's a developer skeleton — you deploy it with your own API keys.
- Not Shopify Admin API. Storefront API only (public, read-only catalog + cart).

## Contributing

PRs welcome. See [CLAUDE.md](./CLAUDE.md) for architectural constraints.

Open an issue to discuss larger features before building.

## License

MIT
