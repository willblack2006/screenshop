THIS FILE IS BINDING.

This is the screenshop generator tool — a Next.js App Router app that generates Shopify storefronts from screenshots using Claude's vision API.

GLOBAL RULES
- Do not invent architecture.
- Do not introduce new tools without approval.
- Do not add features not in this plan.
- Assume the simplest correct solution.

ALLOWED TECHNOLOGIES
- Next.js App Router
- React / TypeScript
- Tailwind CSS 4
- Anthropic Messages API (vision)
- jszip
- @monaco-editor/react

FORBIDDEN
- Stripe, Firebase, Supabase, Prisma, MongoDB
- Any auth provider
- Any database
- Shopify Admin API
- REST APIs

CREDENTIAL RULES
- ANTHROPIC_API_KEY lives in .env.local only — never in client code
- SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN live in .env.local only
- No credentials are ever accepted from the browser UI

DEFINITION OF DONE
- npm run build passes with zero TypeScript errors
- A screenshot upload triggers a real Claude API call
- The download produces a valid, runnable Next.js ZIP
