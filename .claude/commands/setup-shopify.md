Connect this generated storefront to a real Shopify store.

Steps:
1. Ask the user for their Shopify store domain (format: my-store.myshopify.com). Explain they can find this in the Shopify admin URL.
2. Ask for their Storefront API access token. Explain how to create one: Shopify Admin → Settings → Apps and sales channels → Develop apps → Create an app → Configure Storefront API scopes (enable `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`) → Install app → Storefront API access token.
3. Write the credentials to `.env.local`:
   ```
   SHOPIFY_STORE_DOMAIN=<domain>
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=<token>
   ```
4. Replace `src/lib/shopify.ts` with the real Shopify implementation by reading `node_modules` or asking the user if they have the real template. If not available, generate a full Shopify Storefront API client with getProducts, getProduct, getCollections, getCollection, createCart, addToCart, updateCart, removeFromCart, getCart functions using the Storefront API GraphQL endpoint.
5. Update `next.config.ts` to add `cdn.shopify.com` as an allowed image domain (remove placehold.co if present).
6. Run `npm run build` to verify everything compiles.
7. Tell the user to restart the dev server with `npm run dev`.
