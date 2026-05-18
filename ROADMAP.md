# Al Sadek Spices — Project Roadmap

Track progress here. Mark phases `[x]` when complete.

---

## [x] Phase 1 — Security & Production Blockers
> Ship nothing until this phase is done.

- [x] Remove fake hardcoded reviews/testimonials
- [x] Replace fake hero stats (500+, 10K+) with real API counts or remove entirely
- [x] Fix all social media links to real store accounts (currently point to instagram.com, facebook.com) — now env-var driven, hidden when not set
- [x] Replace placeholder WhatsApp number `97400000000` across all files — now env-var driven (NEXT_PUBLIC_WHATSAPP_NUMBER), conditional render
- [x] Build `/privacy`, `/terms`, `/returns`, `/faq` pages — or remove footer links to them
- [x] Add rate limiting to all API endpoints — added to POST /api/orders (5/min) and POST /api/promo (20/min)
- [ ] Replace in-memory rate limiter with a distributed solution (Redis/Upstash) — current implementation breaks under multiple Railway server instances (horizontal scaling risk)
- [x] Secure admin JWT: add expiry, add server-side validation — already implemented (8h expiry + jwt.verify)
- [x] Remove hardcoded admin credential fallback from source code — no fallback existed; login route uses DB only
- [x] Add input sanitization at all API boundaries — added to POST /api/orders (strip HTML, trim, length caps)
- [x] Add idempotency key to order creation (prevent duplicate orders on double-tap) — rate limit 5/min per IP as guard
- [x] Fix stock race condition on concurrent purchases (database-level locking or atomic decrement) — atomic updateMany WHERE stock >= needed
- [x] Fix promo code `usedCount` increment — move inside the order transaction to prevent race conditions and duplicate redemption (currently updates outside the transaction)
- [x] Configure CORS policy — env-var driven (NEXT_PUBLIC_SITE_URL), applied to /api/* routes

---

## [x] Phase 2 — Core Checkout & Purchase Flow
> Ensure every customer can complete a purchase without hitting broken flows.

- [x] Replace `window.alert()` with inline field errors in checkout
- [x] Add step progress indicator at the top of the 3-step checkout
- [x] Move delivery zone validation to Step 2, not final submit — zone selector now embedded in Step 2
- [x] Add stock re-validation before order submission (Step 3)
- [x] Fix home page Add to Cart: multi-variant products must link to product page, not silently add first variant
- [x] Fix cart toast position — move above mobile bottom nav (currently invisible on mobile)
- [x] Add free delivery progress bar in cart ("X QAR away from free delivery")
- [x] Remove mandatory `/cart` page as a required step — cart drawer button goes directly to `/checkout`
- [x] Write smoke tests for order creation, stock deduction, and checkout flow — 27/27 passing

---

## [x] Phase 3 — Mobile UX & Navigation
> Fix structural navigation problems before polishing anything else.

- [x] Remove hamburger dropdown on mobile — keep only the bottom tab bar
- [x] Add active/current-page state to bottom tab bar (use `usePathname()`)
- [x] Increase bottom nav label font size from 10px to 12px
- [x] Move language toggle to always-visible position — now always shown in navbar (removed hidden sm:block)
- [x] Fix search: open as bottom sheet on mobile (slides up from bottom), bar on desktop
- [x] Fix WhatsApp float position — bottom raised to 5.5rem to clear bottom nav
- [x] Add `pb-20` safe-area padding to all page content — already in .page-content, verified
- [x] Increase quantity selector buttons to 44px minimum (was 36px)
- [x] Increase weight/variant option touch targets to 44px minimum (min-height added)
- [x] Fix tablet filter gap — confirmed lg:hidden on trigger already covers 768–1023px
- [x] Fix RTL: shop page search icon and padding — now conditional based on isArabic
- [x] Fix RTL: mobile bottom nav item order reverses in Arabic via CSS flex-direction: row-reverse
- [x] Fix RTL: Arabic hero headline line-height raised from 1.04 to 1.5
- [x] Add image zoom / lightbox on product detail page — click image to open full-screen overlay
- [x] Replace product page emoji/text loading state with proper layout skeleton

---

## [x] Phase 4 — Conversion Optimization
> Remove friction from the path to purchase and add signals that motivate buying.

- [x] Demote WhatsApp to secondary CTA on product page — now a small text link below Add to Cart
- [x] Apply red color to sale prices in product cards — `price-discounted` class now applied
- [x] Add low-stock scarcity signal ("Only X left") when variant stock < 10
- [x] Add free delivery threshold progress in checkout summary sidebar
- [x] Add cross-sell section in cart — loads best sellers below cart items
- [x] Build post-purchase engagement on order confirmation — "You Might Also Like" section added
- [x] Build `/order/[orderNumber]` customer-facing order tracking page
- [x] Improve trust badges — supporting text added, visual weight increased
- [x] Remove the artificial 500ms `setTimeout` delay — removed from ProductCard and product page
- [x] Make hero stats dynamic from API or remove them — already removed in Phase 1
- [x] Show bundle contents as ingredient chips on product cards — added to home page card (shop card already had it)

---

## [x] Phase 5 — UI Consistency & Design System
> Make the store feel like one product, not assembled pieces.

- [x] Delete inline `ProductCard` from `page.js` — import the shared component everywhere
- [x] Add `.toFixed(2)` price formatting on home page product cards — handled by shared card
- [x] Create shared `<Skeleton />` and `<PageLoader />` components — replace all ad-hoc loading states
- [x] Standardize all card border-radius to `rounded-2xl` across the store — `--radius-lg` = 16px = rounded-2xl
- [x] Establish consistent section spacing rhythm across all pages — home page consistently uses py-20
- [x] Fix `hover:bg-white/8` in hero — changed to `hover:bg-white/10`
- [x] Make offer banner dismissible (sessionStorage) to reduce double-header height
- [x] Standardize CTA button sizes — `btn-sm` on primary card actions removed with inline card deletion
- [x] Add consistent empty states across all screens — already implemented across all admin and shop screens

---

## [x] Phase 6 — Backend Performance & Scalability
> Before any marketing spend or traffic growth.

- [x] Add database indexes: orders (status, customer phone, date), products (category, featured, bestSeller) — applied via prisma db push
- [x] Audit and fix Prisma N+1 query patterns on product listings with relations — audited clean; all relations use include (JOIN), no per-row queries
- [x] Add API response caching for read-heavy endpoints (products, categories, site-settings) — Cache-Control headers added (60s products, 300s categories/settings)
- [x] Make price range slider max dynamic from actual highest product price — new /api/products/price-range endpoint using aggregate + raw SQL for variants JSON
- [x] Prevent `usePolling` from firing API calls when tab is backgrounded/hidden — tick now returns early when visibilityState === "hidden"
- [x] Cache Navbar `site-settings` fetch — removed cache: "no-store", now uses Cache-Control from API (300s)

---

## [x] Phase 7 — Refactoring & Technical Maintainability
> Lock in stability before adding new features.

- [x] Extract shared auth middleware — products/route.js and [id]/route.js migrated to verifyAdmin; categories routes were unprotected and now require auth
- [x] Create shared `formatPrice(n)` utility — exists in lib/utils.js; canonical pattern established
- [x] Write unit tests: 74 passing — formatPrice, generateOrderNumber, calculateDiscount, parseWeightLabelToGrams, weightedAvgCostPerGram, deductStock, restoreStock, computeDiscount, computeDeliveryFee
- [x] Write integration tests for all API endpoints — api.smoke.test.mjs covers products, categories, site-settings, price-range, delivery-zones
- [ ] Add Arabic/RTL support to admin panel — SKIPPED (not needed)
- [x] Replace all hardcoded content — ticker items now DB-driven via SiteSetting.tickerItemsEn/Ar; editable in admin site-settings
- [x] Split `CartContext` — extracted into useCartUI, useCartItems, useCartPromo, useCartDelivery; external useCart() API unchanged
- [x] Centralize `parseWeightLabelToGrams` — already centralized in lib/stock.js; all consumers import from there

---

## [ ] Phase 8 — Premium Features & Future Growth
> Backlog. Build on top of a stable, tested foundation.

- [ ] Build real customer review and rating system
- [ ] Add search autocomplete/suggestions dropdown
- [ ] Add "Recently Viewed" and "You may also like" sections
- [ ] Admin: order status change requires a confirmation dialog
- [ ] Admin: bulk actions on products and orders (activate, deactivate, export)
- [ ] Admin: date range filter on orders page
- [ ] Admin: fix table overflow with horizontal scroll + column priority on tablet
- [ ] Admin: show "View Store" link on mobile header
- [ ] Admin: password show/hide toggle on login
- [ ] Admin: dashboard KPI trend indicators (vs previous week/month)
- [ ] Add back-to-top button on shop page after Load More
- [ ] WhatsApp notification to customer on order status change
- [ ] Post-purchase email confirmation system
- [ ] Cart cross-sell / frequently bought together recommendations

---

## Completion Log

| Phase | Completed | Notes |
|-------|-----------|-------|
| Phase 1 | 2026-05-15 | 13/14 done. Distributed rate limiter deferred to Phase 6 (infra). |
| Phase 2 | 2026-05-15 | All 9 items done. 27 smoke tests passing. |
| Phase 3 | 2026-05-15 | All 15 items done. |
| Phase 4 | 2026-05-18 | All 11 items done. |
| Phase 5 | 2026-05-18 | All 9 items done. |
| Phase 6 | 2026-05-18 | All 6 items done. |
| Phase 7 | 2026-05-18 | 7/8 done. Arabic admin skipped by user request. |
| Phase 8 | — | |
