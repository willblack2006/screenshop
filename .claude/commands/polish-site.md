Polish a generated storefront from draft to publishable quality.

This skill takes a site produced by `/clone-site` and iterates on it until it visually matches the source site's design language and looks like something you'd actually ship.

---

## Step 1 — Identify the project

Extract the slug from the user's message (e.g. `casely` from "polish casely" or "finish casely").

If no slug is given, list the contents of `output/` and ask which project to polish.

Confirm these paths exist before proceeding:
- `output/<slug>/` — the generated Next.js project
- `screenshots/source-<slug>/screenshot.png` — the original site
- `screenshots/source-<slug>/screenshot-mobile.png` — original mobile

---

## Step 2 — Determine the next screenshot label and take a fresh shot

**Screenshot naming convention:**
- First generation → `screenshot-draft.png`
- First polish pass → `screenshot-polished.png`
- Each subsequent pass → `screenshot-polished2.png`, `screenshot-polished3.png`, etc.

Before screenshotting, determine the next available label:

```bash
n=0
label="polished"
while [ -f "screenshots/result-<slug>/screenshot-${label}.png" ]; do
  n=$((n+1))
  label="polished${n}"
done
echo "Next label: $label"
```

Start the dev server if it isn't running:

```bash
cd output/<slug> && npm run dev -- --port 3001 &
```

Wait for it to be ready:

```bash
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q 200 && break
  sleep 1
done
```

Take the screenshot using the label computed above:

```bash
node scripts/screenshot.mjs http://localhost:3001 screenshots/result-<slug> $label
```

This preserves all previous screenshots. The folder will accumulate:
```
screenshots/result-<slug>/
  screenshot-draft.png
  screenshot-draft-mobile.png
  screenshot-polished.png
  screenshot-polished-mobile.png
  screenshot-polished2.png          ← added on second polish pass
  screenshot-polished2-mobile.png
```

---

## Step 3 — Visual comparison

Read all four screenshots using the Read tool simultaneously:

1. `screenshots/source-<slug>/screenshot.png` — original site desktop
2. `screenshots/source-<slug>/screenshot-mobile.png` — original site mobile
3. `screenshots/result-<slug>/screenshot-<$label>.png` — current result desktop
4. `screenshots/result-<slug>/screenshot-<$label>-mobile.png` — current result mobile

where `$label` is the label computed in Step 2.

Build a **gap analysis** — a ranked list of visual problems. Evaluate every dimension below. Be specific about which file and which element needs changing.

### What to look for

**Color fidelity**
- Does the background color match?
- Are primary buttons the right color?
- Does the header/nav color match?
- Are text colors accurate (headings vs body vs muted)?
- Are border/divider colors right?

**Typography**
- Is font weight consistent with the source? (bold headers, lighter body)
- Is font size hierarchy correct? (hero title >> section titles >> body)
- Is letter-spacing/tracking used on headings or uppercase labels?
- Is line-height comfortable or cramped?

**Layout & spacing**
- Is the hero section the right height and padding?
- Is content width/max-width correct (full-bleed vs centered container)?
- Is grid column count correct for the product grid?
- Is there enough whitespace between sections?
- Are section dividers, borders, or horizontal rules present?

**Components**
- Does the header match? (logo placement, nav links, cart icon style)
- Do product cards look like the source? (image ratio, card padding, price placement)
- Does the footer have the right structure?
- Are buttons the right shape? (pill vs rounded vs sharp corners)
- Are there hover/focus states on interactive elements?

**Images**
- Are image aspect ratios correct? (square, portrait, landscape)
- Are images cropped or distorted?
- Is `object-fit` set correctly?

**Mobile**
- Does the mobile layout collapse cleanly?
- Is the hamburger menu or mobile nav present if the source uses one?
- Are touch targets large enough?
- Does text scale down appropriately?

**Polish signals** (things that separate draft from published)
- Consistent spacing scale (everything on a grid, not random pixel values)
- Smooth transitions on hover states
- No raw unstyled HTML visible
- No placeholder text that says "Lorem ipsum" or "Demo Brand" in headings
- No broken layout at any section boundary

---

## Step 4 — Read the files that need fixing

Based on the gap analysis, read the specific files with problems. Do not read files you don't need to change.

Common files:
- `output/<slug>/src/app/globals.css` — color vars, base typography
- `output/<slug>/src/app/page.tsx` — hero, collections, product grid
- `output/<slug>/src/components/header.tsx` — nav, logo, cart icon
- `output/<slug>/src/components/footer.tsx`
- `output/<slug>/src/components/product-card.tsx`
- `output/<slug>/src/app/products/[handle]/page.tsx`
- `output/<slug>/src/app/cart/page.tsx` or `cart/client.tsx`

---

## Step 5 — Fix round 1: color system and typography

This pass fixes everything in `globals.css` and the base layout. These are foundational — get them right before touching components.

**Color fixes:**
- Re-extract the exact hex values from the source screenshot
- Update `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-text`, `--color-border`, `--color-muted` in `:root`
- Add any missing semantic color vars (e.g. `--color-text-muted`, `--color-surface`, `--color-surface-hover`)

**Typography fixes:**
- Add `@import` for any Google Font that matches the source typography style if one can be identified (e.g. serif sites often use Playfair Display or Cormorant; minimal sans-serif sites often use Inter or DM Sans)
- Set `font-family`, `font-size`, `line-height` on `body` in globals.css
- Add heading styles if needed (`h1`, `h2`, `h3` with appropriate weights and tracking)

**Base layout fixes:**
- Set `max-width` on a container class if the source uses a centered layout
- Set correct `padding` defaults for sections

---

## Step 6 — Fix round 2: components

Fix each component identified in the gap analysis. Work file by file. For each file:

1. Read it if not already read
2. Apply fixes — be surgical, change only what the gap analysis identified
3. Do not refactor or rename things that work

### Common fixes by component

**Header:**
- Match logo/brand name alignment (left vs center)
- Fix nav link spacing and font style
- Make cart icon match source (bag icon, count badge style)
- Fix header height and sticky behavior if source uses it
- Match background color (transparent over hero, solid otherwise)

**Product cards:**
- Fix image aspect ratio with `aspect-ratio: 4/5` or whatever the source uses
- Fix card padding and gap between image and text
- Match price display (size, weight, color, placement below title vs inline)
- Add hover effect if source shows one (scale image, show quick-add, etc.)
- Fix button or "add to cart" element style

**Hero section:**
- Match height (`min-h-screen` vs `min-h-[600px]` vs fixed)
- Fix text alignment (centered vs left-aligned)
- Fix CTA button style — this is usually the most prominent button on the page
- Add background image/gradient/pattern if source uses one
- Fix headline size (should be substantially larger than body text)

**Collections grid:**
- Match layout (2-col, 3-col, or horizontal scroll)
- Fix collection card image ratio
- Fix overlay text style if source uses image overlays

**Footer:**
- Match column structure
- Fix link list style (spacing, hover color)
- Match border-top or background color

**Product detail page:**
- Fix image/info split layout (50/50 vs 60/40 etc.)
- Fix variant selector style (pills vs dropdown vs swatches)
- Fix add-to-cart button size and style (should be prominent)

---

## Step 7 — Fix round 3: spacing and polish

This pass elevates the site from "functional" to "published quality."

**Spacing consistency:**
- Audit section padding — all major sections should use the same vertical rhythm (e.g. `py-16 md:py-24` consistently)
- Ensure product grids have consistent gap values
- Remove any accidental extra margin or padding that breaks alignment

**Interactive states:**
- Add `transition-colors duration-200` or `transition-transform duration-200` to buttons and links
- Add `hover:opacity-80` or specific hover color to links
- Add `hover:scale-105` to product card images if source uses zoom-on-hover

**Typography polish:**
- Uppercase + letter-spacing for section labels / category names if source uses it
- Correct heading hierarchy on each page (only one `h1` per page)
- Ensure body text has comfortable `leading-relaxed` or `leading-loose`

**Visual details:**
- Add `rounded` classes to match source border-radius (pill buttons, card corners, etc.)
- Add `shadow` if cards in source have drop shadows
- Add `border` and `divide` classes where source uses subtle dividers
- Check that `<Image>` components use correct `sizes` attribute for responsive loading

---

## Step 8 — Screenshot and evaluate

Compute the next available label (same logic as Step 2 — `polished` if it doesn't exist yet, otherwise `polished2`, `polished3`, etc.) and take a new screenshot:

```bash
n=0
label="polished"
while [ -f "screenshots/result-<slug>/screenshot-${label}.png" ]; do
  n=$((n+1))
  label="polished${n}"
done
node scripts/screenshot.mjs http://localhost:3001 screenshots/result-<slug> $label
```

Read both screenshots again (source + the new labeled result) and score the result on:

| Dimension | Score (1–5) |
|---|---|
| Color fidelity | |
| Typography match | |
| Layout structure | |
| Component quality | |
| Mobile layout | |
| Polish / detail | |

If any dimension is below 4, identify the remaining issues and go back to Step 5–7 for another round. Be specific about what still needs fixing.

---

## Step 9 — Final check

Before declaring done, verify:

- [ ] No raw placeholder text visible in headings or hero (e.g. "Demo Brand", "Your Store")
- [ ] No broken sections — every section has visible content
- [ ] Header and footer render on all pages
- [ ] Product grid shows products with images
- [ ] Add to cart button works (updates cart count in header)
- [ ] Cart page shows line items
- [ ] `npm run build` passes with zero TypeScript errors

Run the build check:

```bash
cd output/<slug> && npm run build 2>&1 | tail -20
```

Fix any TypeScript errors before finishing.

---

## Step 10 — Stop server and report

Kill the dev server. Then tell the user:

```
Polished! Here's what was fixed:

[List every change made, grouped by file]

Source (original site):
  screenshots/source-<slug>/screenshot.png
  screenshots/source-<slug>/screenshot-mobile.png

Your iterations:
  screenshots/result-<slug>/screenshot-draft.png
  screenshots/result-<slug>/screenshot-polished.png
  screenshots/result-<slug>/screenshot-polished2.png   ← (if additional passes were run)

To run it:
  cd output/<slug>
  npm run dev
```

If the result still has gaps that can't be fixed without assets the site doesn't have (custom fonts not available via Google Fonts, proprietary icons, real product images), note them explicitly so the user knows what to swap in manually.
