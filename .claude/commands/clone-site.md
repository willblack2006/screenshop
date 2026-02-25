Clone a website's visual design into a running Next.js storefront.

---

## Step 1 — Parse input

Extract from the user's message:
- **Target URL** — the site to clone (e.g. `https://casely.com`)
- **Product/goal description** — what the user sells or wants the store to be about

If either is missing, ask before proceeding. Do not guess.

Normalize the URL: if no scheme is present, prepend `https://`.

---

## Step 2 — Create slug

Derive a short kebab-case project name from the domain:
- `casely.com` → `casely`
- `shop.allbirds.com` → `allbirds`
- Strip `www.`, TLD, and any subdomains that look like `shop.` or `store.`

---

## Step 3 — Create directories

```bash
mkdir -p output/<slug>/src/app/products/\[handle\]
mkdir -p output/<slug>/src/app/collections/\[handle\]
mkdir -p output/<slug>/src/app/cart
mkdir -p output/<slug>/src/app/api/cart
mkdir -p output/<slug>/src/components
mkdir -p output/<slug>/src/lib
mkdir -p output/<slug>/.claude/commands
mkdir -p screenshots/source-<slug>
mkdir -p screenshots/result-<slug>
```

---

## Step 4 — Screenshot the source site

```bash
node scripts/screenshot.mjs <url> screenshots/source-<slug>
```

This saves:
- `screenshots/source-<slug>/screenshot.png` (1440×900 desktop)
- `screenshots/source-<slug>/screenshot-mobile.png` (390×844 mobile)

---

## Step 5 — Read and analyze the screenshot

Use the Read tool to view `screenshots/source-<slug>/screenshot.png`.

Extract from the screenshot:
- **Color palette** — primary, secondary, accent, background, text, border colors (as hex values)
- **Typography feel** — serif/sans-serif, weight, letter-spacing style
- **Layout style** — full-width hero, centered content, grid density, whitespace
- **Component patterns** — card style, button shape, header layout, footer style
- **Overall mood** — luxury/minimal/playful/bold/etc.

---

## Step 6 — Generate 11 source files

Write all 11 files into `output/<slug>/src/`. Base the visual design entirely on what you observed in the screenshot. **Never copy brand names, logos, or trademarked content** — use neutral placeholders in the design language of the original.

### Coding rules (non-negotiable)

- **Tailwind CSS 4 only** — no inline styles, no CSS modules, no styled-components
- **TypeScript strict** — all props and return types explicitly typed
- **Server Components by default** — only add `"use client"` when using hooks or event handlers
- **`next/image`** for all images, **`next/link`** for all navigation
- **Extract the color palette** into CSS custom properties in `globals.css`
- **Import shopify helpers** from `@/lib/shopify` for all data fetching
- **Import cart context** from `@/components/cart-provider`

---

### File 1: `src/app/globals.css`

Define CSS custom properties from the extracted color palette and apply Tailwind base styles.

```css
@import "tailwindcss";

:root {
  --color-primary: <extracted-hex>;
  --color-secondary: <extracted-hex>;
  --color-accent: <extracted-hex>;
  --color-bg: <extracted-hex>;
  --color-text: <extracted-hex>;
  --color-border: <extracted-hex>;
  /* add more as needed */
}
```

---

### File 2: `src/app/layout.tsx`

Root layout. Wraps children in `CartProvider`. Imports globals.css. Sets font and background from CSS vars.

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "<store-name>",
  description: "<product-description>",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
        <CartProvider>
          <Header />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
```

---

### File 3: `src/app/page.tsx`

Homepage: hero section, collections grid, featured products grid. Server component.

```tsx
import { getProducts, getCollections } from "@/lib/shopify";
import ProductCard from "@/components/product-card";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const [products, collections] = await Promise.all([
    getProducts(8),
    getCollections(3),
  ]);

  return (
    <main>
      {/* Hero section — styled to match screenshot */}
      {/* Collections grid */}
      {/* Featured products grid */}
    </main>
  );
}
```

Implement all three sections with proper Tailwind classes derived from the screenshot analysis.

---

### File 4: `src/app/products/[handle]/page.tsx`

Product detail page. Server component.

```tsx
import { getProduct, getProducts } from "@/lib/shopify";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductGallery from "@/components/product-gallery";
import ProductOptions from "@/components/product-options";

export async function generateStaticParams() {
  const products = await getProducts(250);
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return {};
  return { title: product.title, description: product.description };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  return (
    <main>
      <ProductGallery images={product.images} title={product.title} />
      <div>
        <h1>{product.title}</h1>
        <p>{product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}</p>
        <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        <ProductOptions product={product} />
      </div>
    </main>
  );
}
```

---

### File 5: `src/app/collections/[handle]/page.tsx`

Collection listing page. Server component. Shows all products in the collection.

```tsx
import { getCollection, getCollections } from "@/lib/shopify";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product-card";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const collections = await getCollections(50);
  return collections.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollection(handle);
  if (!collection) return {};
  return { title: collection.title, description: collection.description };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const collection = await getCollection(handle);
  if (!collection) notFound();

  return (
    <main>
      <div>
        <h1>{collection.title}</h1>
        <p>{collection.description}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {collection.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
```

---

### File 6: `src/app/cart/page.tsx`

Cart page. Server component. Reads cartId from localStorage via CartProvider state (the CartProvider exposes cart state to client components; the page itself is a server component that passes data through the CartProvider).

Since the cart lives in the CartProvider (client-side), the cart page renders a client component that reads cart from context:

```tsx
import CartPageClient from "./client";

export default function CartPage() {
  return <CartPageClient />;
}
```

Then create `src/app/cart/client.tsx`:

```tsx
"use client";
import { useCart } from "@/components/cart-provider";
import Link from "next/link";
import Image from "next/image";

export default function CartPageClient() {
  const { cart, updateItem, removeItem } = useCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <main>
        <h1>Your cart is empty</h1>
        <Link href="/">Continue shopping</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Cart</h1>
      {cart.lines.map((line) => (
        <div key={line.id}>
          {line.merchandise.image && (
            <Image
              src={line.merchandise.image.url}
              alt={line.merchandise.image.altText ?? line.merchandise.title}
              width={80}
              height={80}
            />
          )}
          <div>
            <p>{line.merchandise.product.title}</p>
            <p>{line.merchandise.title}</p>
            <p>{line.merchandise.price.amount} {line.merchandise.price.currencyCode}</p>
          </div>
          <div>
            <button onClick={() => updateItem(line.id, line.quantity - 1)}>-</button>
            <span>{line.quantity}</span>
            <button onClick={() => updateItem(line.id, line.quantity + 1)}>+</button>
            <button onClick={() => removeItem(line.id)}>Remove</button>
          </div>
        </div>
      ))}
      <div>
        <p>Subtotal: {cart.cost.subtotalAmount.amount} {cart.cost.subtotalAmount.currencyCode}</p>
        <p>Taxes and shipping calculated at checkout.</p>
        <a href={cart.checkoutUrl}>Proceed to checkout</a>
      </div>
    </main>
  );
}
```

Style all of this properly with Tailwind using the extracted color palette.

---

### File 7: `src/components/header.tsx`

Navigation header with logo/store name, nav links to collections, and cart icon showing item count. Server component wrapping a client component for the cart count.

Include:
- Store name / logo area
- Navigation links (Home, Collections, About or similar)
- Cart icon with item count (needs `"use client"` and `useCart()`)

Split into a server wrapper + `header-cart.tsx` client component for the cart icon.

---

### File 8: `src/components/footer.tsx`

Footer with store name, brief tagline, and basic links. Server component.

---

### File 9: `src/components/product-card.tsx`

Reusable product card. Server component (no client directive).

```tsx
import type { Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

type Props = {
  product: Pick<Product, "handle" | "title" | "featuredImage" | "priceRange">;
};

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/products/${product.handle}`}>
      {product.featuredImage && (
        <Image
          src={product.featuredImage.url}
          alt={product.featuredImage.altText ?? product.title}
          width={product.featuredImage.width}
          height={product.featuredImage.height}
        />
      )}
      <div>
        <p>{product.title}</p>
        <p>{product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}</p>
      </div>
    </Link>
  );
}
```

Style the card to match the screenshot's card design.

---

### File 10: `src/components/product-gallery.tsx`

Image gallery for the product detail page. `"use client"` — manages selected image state.

```tsx
"use client";
import type { Image as ShopifyImage } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

type Props = { images: ShopifyImage[]; title: string };

export default function ProductGallery({ images, title }: Props) {
  const [selected, setSelected] = useState(0);
  const main = images[selected];

  return (
    <div>
      {main && (
        <Image
          src={main.url}
          alt={main.altText ?? title}
          width={main.width}
          height={main.height}
          priority
        />
      )}
      <div>
        {images.map((img, i) => (
          <button key={img.url} onClick={() => setSelected(i)}>
            <Image
              src={img.url}
              alt={img.altText ?? `${title} ${i + 1}`}
              width={80}
              height={80}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### File 11: `src/components/product-options.tsx`

Variant selectors + add to cart button. `"use client"`.

```tsx
"use client";
import type { Product } from "@/lib/types";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

type Props = { product: Product };

export default function ProductOptions({ product }: Props) {
  const { addItem, loading } = useCart();
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const opt of product.options) init[opt.name] = opt.values[0];
    return init;
  });

  const matchedVariant = product.variants.find((v) =>
    v.selectedOptions.every((o) => selected[o.name] === o.value)
  );

  return (
    <div>
      {product.options.map((option) => (
        <div key={option.name}>
          <p>{option.name}</p>
          <div>
            {option.values.map((value) => (
              <button
                key={value}
                onClick={() => setSelected((s) => ({ ...s, [option.name]: value }))}
                className={selected[option.name] === value ? "selected" : ""}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={() => matchedVariant && addItem(matchedVariant.id)}
        disabled={loading || !matchedVariant || !matchedVariant.availableForSale}
      >
        {loading ? "Adding..." : !matchedVariant?.availableForSale ? "Out of stock" : "Add to cart"}
      </button>
    </div>
  );
}
```

Replace the skeleton JSX above with properly Tailwind-styled markup matching the screenshot design.

---

## Step 7 — Copy templates

Read each template file from `templates/` and write it to the correct location in `output/<slug>/`. Do this for all 13 files:

| Source | Destination |
|--------|-------------|
| `templates/shopify-mock.ts.template` | `output/<slug>/src/lib/shopify.ts` |
| `templates/types.ts.template` | `output/<slug>/src/lib/types.ts` |
| `templates/cart-provider.tsx.template` | `output/<slug>/src/components/cart-provider.tsx` |
| `templates/cart-route.ts.template` | `output/<slug>/src/app/api/cart/route.ts` |
| `templates/next.config.ts.template` | `output/<slug>/next.config.ts` |
| `templates/package.json.template` | `output/<slug>/package.json` |
| `templates/tsconfig.json.template` | `output/<slug>/tsconfig.json` |
| `templates/postcss.config.mjs.template` | `output/<slug>/postcss.config.mjs` |
| `templates/gitignore.template` | `output/<slug>/.gitignore` |
| `templates/claude-md.template` | `output/<slug>/CLAUDE.md` |
| `templates/env.local.template` | `output/<slug>/.env.local` (commented out, no real creds) |
| `templates/setup-shopify.md.template` | `output/<slug>/.claude/commands/setup-shopify.md` |
| `templates/shopify-headless.md.template` | `output/<slug>/.claude/commands/shopify-headless.md` |

**Shopify credentials check:** Before writing `.env.local`, check if `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` are set in the current environment (read the parent `.env.local` if it exists). If both are present:
- Use `templates/shopify.ts.template` instead of `shopify-mock.ts.template` for `src/lib/shopify.ts`
- Substitute the real values into `env.local.template` (replace `{{SHOPIFY_DOMAIN}}` and `{{SHOPIFY_TOKEN}}`)

If creds are not present, write `.env.local` with both lines commented out:
```
# SHOPIFY_STORE_DOMAIN=
# SHOPIFY_STOREFRONT_ACCESS_TOKEN=
```

---

## Step 8 — Install dependencies

```bash
cd output/<slug> && npm install
```

Wait for this to complete before proceeding.

---

## Step 9 — Start dev server

```bash
cd output/<slug> && npm run dev -- --port 3001
```

Run this in the background. Note the process ID.

---

## Step 10 — Wait for server

Poll `http://localhost:3001` until it returns a 200 response or 30 seconds pass.

```bash
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q 200 && break
  sleep 1
done
```

---

## Step 11 — Screenshot the result

```bash
node scripts/screenshot.mjs http://localhost:3001 screenshots/result-<slug>
```

Keep the dev server running — you'll need it for the polish pass.

---

## Step 12 — Visual gap analysis

Read all four screenshots simultaneously using the Read tool:

1. `screenshots/source-<slug>/screenshot.png`
2. `screenshots/source-<slug>/screenshot-mobile.png`
3. `screenshots/result-<slug>/screenshot.png`
4. `screenshots/result-<slug>/screenshot-mobile.png`

Also check for broken rendering — anything that would block the user from even evaluating the design:

```bash
curl -s http://localhost:3001 | grep -i "error\|undefined\|cannot read" | head -5
```

Build a gap analysis. For each issue found, assign a severity:

- 🔴 **Broken** — page crashes, layout completely wrong, content missing
- 🟡 **Off** — visible but doesn't match the source (wrong colors, spacing, structure)
- 🟢 **Polish** — close but missing detail (hover states, transitions, spacing refinement)

Evaluate every dimension:

**Colors** — background, header, buttons, text, borders
**Typography** — font weight, size hierarchy, letter-spacing
**Layout** — hero height, container width, section padding, grid columns
**Components** — header structure, product card design, footer layout, button shapes
**Images** — aspect ratios, object-fit, broken images
**Mobile** — layout collapse, nav, touch targets, text scaling
**Polish** — hover states, transitions, consistent spacing, no raw unstyled elements

---

## Step 13 — Present findings and ask for guidance

Show the user the issues you found, grouped by severity. Be specific and concise — name the file and element, not just the symptom.

Example format:

```
Here's what I found comparing your generated store to [source site]:

🔴 Broken
  - Hero section has no background color — shows white instead of the dark navy from the source
  - Product cards missing — grid renders but images are broken (placehold.co blocked by next.config?)

🟡 Off
  - Header: logo is left-aligned but source centers it over a full-width banner
  - Product cards: image ratio is 1:1 but source uses portrait 4:5
  - Button corners: source uses pill shape (rounded-full), generated uses rounded-md
  - Footer: missing the email signup section visible in the source

🟢 Polish
  - Product card hover has no transition (source slides image up slightly)
  - Section spacing is inconsistent — hero uses py-8, products section uses py-20
  - Mobile nav is missing — collapses to nothing on small screens

What would you like me to fix first? I can:
  A) Fix everything (start with broken, then off, then polish)
  B) Just fix the broken and off issues, leave polish for later
  C) Focus on a specific area — just tell me which
```

**Wait for the user's response before making any changes.**

---

## Step 14 — Fix issues

Based on the user's direction, fix the identified issues. Work in order: broken → off → polish.

For each file you need to change:
1. Read it first
2. Make targeted edits — change only what was identified, don't refactor surrounding code
3. Don't restart the server between edits — Next.js hot reloads automatically

**Common fixes:**

*Colors:* Update CSS custom properties in `globals.css`. Re-extract exact hex values from the source screenshot — look at the screenshot pixel-by-pixel if needed.

*Layout:* Fix padding, max-width, and grid columns in the affected page or component.

*Image ratios:* Wrap `<Image>` in a container with `aspect-ratio` and use `fill` + `object-cover`:
```tsx
<div className="relative aspect-[4/5] overflow-hidden">
  <Image src={...} alt={...} fill className="object-cover" />
</div>
```

*Button shapes:* Change `rounded-md` → `rounded-full` (pill) or remove rounding entirely.

*Hover states:* Add `group` to the container and `group-hover:scale-105 transition-transform duration-300` to the image.

*Mobile nav:* Add a hamburger button with `md:hidden` and a dropdown that shows on toggle — use `"use client"` and `useState`.

After making all changes, take a fresh screenshot:

```bash
node scripts/screenshot.mjs http://localhost:3001 screenshots/result-<slug>
```

Read both screenshots (source + result) again. If significant gaps remain, tell the user what's still off and ask if they want another pass.

---

## Step 15 — Stop the dev server

Kill the dev server process.

---

## Step 16 — Final report

Tell the user what was built and what was fixed:

```
Done! Your storefront is at output/<slug>/

What was fixed in the polish pass:
  [list every change made, one line each]

To run it:
  cd output/<slug>
  npm run dev

Source:  screenshots/source-<slug>/screenshot.png
Result:  screenshots/result-<slug>/screenshot.png

To connect a real Shopify store, open Claude Code inside output/<slug>/ and run /setup-shopify.
```

If there are remaining gaps that can't be fixed without assets the tool doesn't have (licensed fonts, real product images, proprietary icons), list them so the user knows what to swap in manually.
