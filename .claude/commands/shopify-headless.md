# Shopify Headless Skill

## Purpose

Enable fast, correct creation of production-grade Shopify headless ecommerce sites using Next.js App Router and the Shopify Storefront API.

This skill defines the architecture, conventions, and implementation patterns Claude Code follows when building Shopify headless storefronts. Every file produced must conform to this document.

---

## Default Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Shopify API | Storefront API 2025-01 (GraphQL) |
| Deployment target | Vercel |
| Cart persistence | HTTP-only cookie via Server Actions |
| Auth | Not included by default — add Customer Account API if required |

---

## Non-Negotiables

### API Version
- Always pin `2025-01` in the endpoint URL: `https://{domain}/api/2025-01/graphql.json`
- Never use `unstable` in production
- The `checkoutCreate` mutation is dead after 2025-04 — never use it. Use `cartCreate` + `cart.checkoutUrl`
- Never request `totalTaxAmount` from cart cost — deprecated in 2025-01. Taxes are shown only at checkout

### Token Handling
- Use the private Storefront token (`SHOPIFY_STOREFRONT_PRIVATE_TOKEN`) on the server only
- Never prefix it with `NEXT_PUBLIC_` — this exposes it in the client bundle
- Never add the Admin API token to a frontend project under any circumstance
- The Admin API has full write access; exposure is a critical security incident

### Request Headers
- Every server-side Storefront API request must include `Shopify-Storefront-Buyer-IP` with the buyer's real IP
- Without this header, Shopify sees all requests from your server IP and will throttle and flag as bot traffic
- Extract buyer IP from `x-forwarded-for` request header

### Data Layer
- All Storefront API calls go through `shopify/storefront.ts` — no direct fetch calls in pages or components
- All mutations check `userErrors` in the response — never ignore this field
- Mutations always use `cache: 'no-store'`
- Cacheable queries use `next: { tags: [...] }` with semantic tag constants from `TAGS`

### Cart
- Store `cartId` in an HTTP-only cookie via Server Actions — never `localStorage`
- `localStorage` is inaccessible server-side and causes hydration mismatches in Server Components
- Preserve the full Shopify cart ID string including the `?key=` suffix — truncating it causes mutation failures
- All cart mutations run in `'use server'` Server Actions in `app/actions/cart.ts`

### Architecture
- Server Components fetch all data and pass it as props
- Client Components handle only interactivity — click handlers, UI state, optimistic updates
- Never call Shopify APIs from client-side `useEffect`

---

## Required Environment Variables

```bash
# .env.local
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com       # No https://, no trailing slash
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=shpat_xxxx         # Server-only. Never NEXT_PUBLIC_
SHOPIFY_REVALIDATION_SECRET=random_secret_here      # For HMAC webhook validation
```

---

## Required Site Deliverables

Every headless site built with this skill must include:

1. **Home page** — product grid fetched server-side, paginated if catalog exceeds 20 products
2. **Product detail page** — images, variant selector, add-to-cart, price, HTML description, `generateMetadata`
3. **Cart page** — server-rendered line items, quantity display, subtotal, checkout button redirecting to `cart.checkoutUrl`
4. **Cart Server Actions** — `addItem`, `updateItem`, `removeItem` in `app/actions/cart.ts`
5. **Revalidation webhook route** — `app/api/revalidate/route.ts` for tag-based ISR invalidation
6. **`shopify/storefront.ts`** — single entry point for all Storefront API access
7. **TypeScript types** — all Shopify response shapes explicitly typed in `shopify/types.ts`

---

## Implementation Patterns

### Storefront Fetch

```typescript
const data = await shopifyFetch<{ products: Connection<Product> }>({
  query: GET_PRODUCTS_QUERY,
  variables: { first: 20 },
  tags: [TAGS.products],
  buyerIP,
});
```

### Server Action (Cart)

```typescript
'use server';
export async function addItem(merchandiseId: string): Promise<{ error?: string }> {
  try {
    const cartId = await getOrCreateCart();
    await addCartLines(cartId, [{ merchandiseId, quantity: 1 }]);
    revalidateTag(TAGS.cart);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to add item' };
  }
}
```

### Static Generation with ISR

```typescript
export const revalidate = false;        // No time-based revalidation
export const dynamicParams = true;      // ISR: build on first request if not pre-built

export async function generateStaticParams() {
  const { products } = await getProducts({ first: 250 });
  return flattenConnection(products).map((p) => ({ handle: p.handle }));
}
```

### Tag-Based Cache Invalidation (Webhook)

```typescript
// app/api/revalidate/route.ts
const topic = req.headers.get('x-shopify-topic');
if (topic?.startsWith('products/')) revalidateTag(TAGS.products);
if (topic?.startsWith('collections/')) revalidateTag(TAGS.collections);
```

---

## Performance Rules

- Tag all product queries with `TAGS.products`, per-product queries additionally with `product-${handle}`
- Tag cart queries with `TAGS.cart`
- Use `generateStaticParams` for all product and collection pages
- For catalogs over 250 SKUs, paginate using `pageInfo.hasNextPage` and `endCursor`
- Set `export const revalidate = false` on statically generated pages — rely on webhooks for invalidation
- Set `export const dynamicParams = true` for ISR on pages not yet pre-built
- Cart page uses `export const dynamic = 'force-dynamic'` — it reads cookies, cannot be cached

## Security Rules

- HTTP-only cookie for `cartId` with `secure: true` in production, `sameSite: 'lax'`
- Private token in server-only env var — no `NEXT_PUBLIC_` prefix
- Validate Shopify HMAC signature on every revalidation webhook request before calling `revalidateTag`
- Never log or surface `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` in error messages or responses

---

## Quality Bar

- Zero TypeScript errors (`strict: true`)
- All mutations handle `userErrors` — never silently ignore cart or checkout errors
- All product and collection pages have `generateMetadata`
- No `any` types in the Shopify data layer (`shopify/` directory)
- All Shopify response shapes are typed in `shopify/types.ts`
- `flattenConnection` used consistently — no manual `edges.map(e => e.node)` in pages or components
- No placeholder data, no mock functions, no TODO comments in shipped code

---

# Build Workflow

Instructions Claude Code follows when building a Shopify headless site. Execute in order. No step is optional.

---

## Step 1 — Gather Requirements

Ask the user the following questions before writing any code. Collect all answers before proceeding.

**Required questions:**

1. What is your Shopify store domain? (format: `your-store.myshopify.com`)
2. Do you have a private Storefront API token? If not, instruct: go to Shopify Admin → Settings → Apps → Develop apps → Create an app → configure Storefront API scopes → install → copy the private token.
3. What is your store's primary locale and currency? (e.g., `en-US`, `USD`)
4. How many products does the catalog have? (affects `generateStaticParams` pagination strategy)
5. Does the store use product variants? (e.g., size, color) — determines variant selector complexity
6. Is customer authentication required? (if yes, use Customer Account API — separate implementation)
7. What is the deployment target? (default: Vercel — affects environment variable setup)

Do not begin implementation until all seven questions are answered.

---

## Step 2 — Bootstrap Project

If no Next.js project exists, run:

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Create `.env.local` with:

```bash
SHOPIFY_STORE_DOMAIN=<user-provided>
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=<user-provided>
SHOPIFY_REVALIDATION_SECRET=<generate a random 32-char string>
```

Verify `tsconfig.json` has `"strict": true`. Enable it if not present.

---

## Step 3 — Implement Shopify Types

Create `shopify/types.ts` first. All other Shopify files depend on it.

Required types:
- `Money` — `{ amount: string; currencyCode: string }`
- `ShopifyImage` — `{ url: string; altText: string | null; width: number; height: number }`
- `SelectedOption` — `{ name: string; value: string }`
- `ProductVariant` — full variant shape including `availableForSale`, `quantityAvailable`, `selectedOptions`, `price`, `compareAtPrice`
- `ProductOption` — `{ name: string; values: string[] }`
- `Product` — full product shape including `variants`, `options`, `images`, `priceRange`, `seo`
- `CartLineMerchandise` — variant fields on a cart line
- `CartLineItem` — `{ id, quantity, merchandise, cost }`
- `Cart` — `{ id, checkoutUrl, totalQuantity, lines, cost }`
- `Connection<T>` — `{ edges: Array<{ node: T }>; pageInfo?: { hasNextPage, endCursor } }`
- `ShopifyFetchOptions` — `{ query, variables?, tags?, cache? }`
- `ShopifyResponse<T>` — `{ data: T; errors?: Array<{ message: string }> }`
- `UserError` — `{ field: string[] | null; message: string }`
- `TAGS` constant — `{ products, collections, cart }`

---

## Step 4 — Implement GraphQL Operations

### Required Queries (`shopify/queries.ts`)

**Fragment — `ProductVariant`:**
- `id`, `title`, `availableForSale`, `quantityAvailable`, `selectedOptions { name value }`, `price { amount currencyCode }`, `compareAtPrice { amount currencyCode }`

**Fragment — `ProductDetails`:**
- Composes `ProductVariant` fragment
- `id`, `title`, `handle`, `description`, `descriptionHtml`, `featuredImage`, `images(first: 10)`, `options { name values }`, `priceRange`, `seo { title description }`, `variants(first: 250)`

**`GET_PRODUCTS_QUERY`:**
- Variables: `$first: Int!`, `$after: String`, `$sortKey: ProductSortKeys`, `$reverse: Boolean`
- Fields: `id`, `title`, `handle`, `featuredImage`, `priceRange.minVariantPrice`, `variants(first: 1)` for availability check
- Include `pageInfo { hasNextPage endCursor }`

**`GET_PRODUCT_BY_HANDLE_QUERY`:**
- Variable: `$handle: String!`
- Use `ProductDetails` fragment

**`GET_CART_QUERY`:**
- Variable: `$cartId: ID!`
- Fields: `id`, `checkoutUrl`, `totalQuantity`, `lines(first: 100)` with full merchandise inline fragment `... on ProductVariant`, `cost { subtotalAmount, totalAmount }` — do NOT include `totalTaxAmount`

### Required Mutations (`shopify/mutations.ts`)

**`CART_CREATE_MUTATION`:**
- Variable: `$input: CartInput!`
- Return: full `Cart` shape + `userErrors { field message }`

**`CART_LINES_ADD_MUTATION`:**
- Variables: `$cartId: ID!`, `$lines: [CartLineInput!]!`
- Return: full `Cart` shape + `userErrors { field message }`

**`CART_LINES_UPDATE_MUTATION`:**
- Variables: `$cartId: ID!`, `$lines: [CartLineUpdateInput!]!`
- Return: updated `Cart` shape + `userErrors { field message }`

**`CART_LINES_REMOVE_MUTATION`:**
- Variables: `$cartId: ID!`, `$lineIds: [ID!]!`
- Return: updated `Cart` shape + `userErrors { field message }`

---

## Step 5 — Implement Storefront API Client

Create `shopify/storefront.ts`:

1. Validate `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` at call time — throw descriptive errors if missing
2. Endpoint: `https://${SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`
3. `shopifyFetch<T>` must:
   - Accept `{ query, variables, tags, cache, buyerIP }`
   - Set `Shopify-Storefront-Private-Token` header
   - Set `Shopify-Storefront-Buyer-IP` header when `buyerIP` is provided
   - Apply `next: { tags }` for cacheable queries
   - Apply `cache: 'no-store'` for mutations
   - Throw on non-OK HTTP status
   - Throw on GraphQL `errors` array
4. Export `TAGS` constant
5. Export `flattenConnection<T>(connection: Connection<T>): T[]`
6. Export `formatMoney(amount: string, currencyCode: string): string` using `Intl.NumberFormat`
7. Export: `getProducts`, `getProductByHandle`, `getCart`, `createCart`, `addCartLines`, `updateCartLines`, `removeCartLines`
8. All cart mutation helpers must throw if `userErrors.length > 0`

---

## Step 6 — Implement Cart Server Actions

Create `app/actions/cart.ts` with `'use server'` directive at top.

Required functions:
- `addItem(merchandiseId: string): Promise<{ error?: string }>`
- `updateItem(lineId: string, quantity: number): Promise<{ error?: string }>`
- `removeItem(lineId: string): Promise<{ error?: string }>`

Internal helpers:
- `getBuyerIP()` — reads `x-forwarded-for` from `headers()`, returns first IP
- `getOrCreateCart()` — reads `cartId` cookie; if missing, calls `createCart()` and sets cookie

Cookie settings:
- Name: `cartId`
- `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`, `maxAge: 604800`

Every action catches errors and returns `{ error: string }` — never rethrow to client.
Every successful mutation calls `revalidateTag(TAGS.cart)`.

---

## Step 7 — Implement Components

### `components/ProductCard.tsx`
- No `'use client'` directive
- Props: `{ product: Pick<Product, 'handle' | 'title' | 'featuredImage' | 'priceRange'> }`
- Renders: `<Link href={/products/${handle}}>`, Next.js `<Image>`, title, formatted price
- No state, no event handlers

### `components/AddToCart.tsx`
- `'use client'` directive
- Props: `{ variant: Pick<ProductVariant, 'id' | 'availableForSale'> | null }`
- Uses `useTransition` — `startTransition(async () => await addItem(variant.id))`
- Button text states: "Add to cart" | "Adding..." | "Out of stock" | "Select a variant"
- Disabled when: `isPending`, `!variant`, `!variant.availableForSale`

### `components/CartDrawer.tsx`
- `'use client'` directive
- Props: `{ cart: Cart | null }`
- Renders line items with quantity controls calling `updateItem` and `removeItem`
- Shows subtotal from `cart.cost.subtotalAmount`
- Checkout button is `<a href={cart.checkoutUrl}>` — not a client-side navigate
- "Taxes and shipping calculated at checkout." — no tax amount displayed
- Empty state: "Your cart is empty."
- Wrap in `pointer-events-none opacity-60` while `isPending`

---

## Step 8 — Implement Pages

### `app/page.tsx`
- Server Component — no `'use client'`
- Extract buyer IP from `headers()` → `x-forwarded-for`
- Call `getProducts({ first: 20, buyerIP })`
- Call `flattenConnection(products)` before mapping
- Render grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- `export const revalidate = false`
- `export const dynamicParams = true`

### `app/products/[handle]/page.tsx`
- Server Component
- `params` is `Promise<{ handle: string }>` in Next.js 15 — always `await params`
- `generateStaticParams`: call `getProducts({ first: 250 })`, return `[{ handle }]` for each
- `generateMetadata`: call `getProductByHandle(handle)`, return `{ title, description, openGraph }`
- `notFound()` if product is null
- Render: images, title, price, options, `<AddToCart variant={firstAvailableVariant} />`
- `firstAvailableVariant`: find first variant where `availableForSale === true`; fall back to `variants[0]`
- `export const revalidate = false`
- `export const dynamicParams = true`

### `app/cart/page.tsx`
- Server Component
- `export const dynamic = 'force-dynamic'`
- Read `cartId` from `cookies()`
- If no `cartId`, render empty cart state with link to home
- Call `getCart(cartId, buyerIP)` — if returns null, render empty state
- Render line items table, order summary with subtotal and total, checkout anchor tag
- Checkout button: `<a href={cart.checkoutUrl}>Proceed to checkout</a>`
- "Taxes and shipping calculated at checkout." text next to summary

### `app/api/revalidate/route.ts`
- Export `async function POST(req: NextRequest)`
- Validate HMAC: compute `HMAC-SHA256` of raw request body using `SHOPIFY_REVALIDATION_SECRET`, compare to `x-shopify-hmac-sha256` header using timing-safe comparison
- Return 401 if HMAC is invalid
- Read `x-shopify-topic` header
- Call `revalidateTag(TAGS.products)` if topic starts with `products/`
- Call `revalidateTag(TAGS.collections)` if topic starts with `collections/`
- Return `NextResponse.json({ revalidated: true, now: Date.now() })`

---

## Step 9 — Verification Checklist

Before declaring the build complete, verify:

- [ ] `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` are in `.env.local`
- [ ] No `NEXT_PUBLIC_SHOPIFY_STOREFRONT_PRIVATE_TOKEN` exists anywhere
- [ ] All cart mutations go through `app/actions/cart.ts`
- [ ] `checkoutUrl` is used for checkout — `checkoutCreate` does not exist in the codebase
- [ ] `totalTaxAmount` is not requested or displayed anywhere
- [ ] `userErrors` is checked in all mutation helpers in `storefront.ts`
- [ ] `Shopify-Storefront-Buyer-IP` is passed in `shopifyFetch` when `buyerIP` is provided
- [ ] `cartId` cookie is `httpOnly`
- [ ] Revalidation route validates HMAC before processing
- [ ] `generateMetadata` is exported from all product pages
- [ ] `generateStaticParams` is exported from all product pages
- [ ] `flattenConnection` is used everywhere — no raw `edges.map(e => e.node)` in pages/components
- [ ] Zero TypeScript errors in strict mode
- [ ] No `any` types in `shopify/` directory
