# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — Gen Z urban buyers.** Vietnamese shoppers roughly 18–30 in Hà Nội and TP. Hồ Chí Minh, shopping mostly on mobile, buying đặc sản, đồ nhà, thời trang and làm đẹp. They are deal-driven and discovery-led: they want a short, confident shelf of Vietnamese goods, a visible discount, fast delivery, and products that feel current enough to share.

**Secondary — small Vietnamese sellers/producers.** Independent shops and makers who need to open a storefront, publish a catalog, manage stock, take orders and withdraw earnings without a separate back-office tool.

## Product Purpose

Chợ Việt is a two-role Vietnamese marketplace. Buyers browse a curated catalog, add to cart, check out with a saved address, coupon and MoMo payment, then follow their order. Sellers open a store, manage products and inventory, watch a dashboard, and withdraw from a seller wallet.

Success means a buyer can go from landing to paid order without friction, and a seller can run a store end-to-end inside the same web app.

## Positioning

A tightly curated Vietnamese marketplace, not an everything-store. Fewer, better items; visible seller identity and story; fast local delivery (the current surface promises 2h in Hà Nội and TP. Hồ Chí Minh); a Gen Z Vietnamese voice. A generic marketplace can copy the features but not the combination of curation, provenance and tone.

## Operating Context

- Monorepo: `apps/web` (Vue 3 SPA), `apps/api` (NestJS + Prisma + PostgreSQL), `packages/shared-types`.
- **Buyer flow:** register/login → browse categories and catalog → product detail → cart → checkout (saved address, coupon, shipping fee) → MoMo sandbox → payment result → order history.
- **Seller flow:** register as seller → create store → create/edit products and upload images to Cloudflare R2 → adjust inventory → dashboard summary → wallet and withdrawal requests.
- Local development runs the SPA on Vite with the API and Postgres/Redis in Docker; seed data provides demo accounts, a store, categories, products and a coupon.
- Prices are in VND. Checkout currently applies free shipping at 500,000₫ and a 30,000₫ fee below that.
- The interface is Vietnamese-only.

## Capabilities and Constraints

- Two roles only: `BUYER` and `SELLER`. The seller channel is role-guarded; there is no admin surface in the web app.
- Auth is email/password with JWT access and refresh tokens.
- Order lifecycle: `PENDING_PAYMENT → PAID → CONFIRMED → PACKING → SHIPPING → DELIVERED → COMPLETED`, plus `CANCELLED`, `REFUND_REQUESTED`, `REFUNDED`.
- Payments run through MoMo sandbox only. Product images use Cloudflare R2 signed uploads; seeded products use local photography under `public/products/`.
- Coupons are store-scoped (`CHOVIET10`, 10% off, no minimum, in seed).
- Explicitly undecided: the operational reality behind the "2h" delivery promise; multi-store checkout and shipping rules; a production payment provider; review/rating moderation; an admin/operations console; real fulfillment or return SLAs.

## Brand Commitments

- The name **Chợ Việt** is fixed.
- Voice is Gen Z Vietnamese: playful, direct, emoji-friendly, code-switching between Vietnamese and product/tech English ("unbox", "trend", "viral"). Existing lines such as "Chọn là ghiền!" and "long lanh như vừa unbox" define the register.
- Existing mark: a circular accent-colored "V" beside the wordmark.
- Demo/seed content must never be presented as real customers, reviews, sales figures or press.

## Evidence on Hand

- Product photography for 23 items in `apps/web/public/products/` (gạo ST25, tôm khô Cà Mau, nước mắm, áo dài, nón lá, ấm trà Bát Tràng, etc.).
- Seed catalog: store "Đất Việt", 7 categories, 140 products, coupon `CHOVIET10`, demo accounts `seller@choviet.local` and `buyer@choviet.local` (password `Demo1234`), one saved buyer address in Quận 1.
- Verification evidence for register, login, browse-catalog, cart and seller-store flows under `.omp/skills/verify-cho-viet/evidence/`.
- **Absent:** real testimonials, customer logos, press mentions, ratings, sales/GMV numbers, and production performance data. Future work must not fabricate them.

## Product Principles

1. **Curation over breadth.** A short, confident shelf beats an endless listing grid; every added category or SKU must earn its place.
2. **The seller stays visible.** Store name, story and identity are part of the product, not metadata to hide behind a generic catalog.
3. **One clear path to purchase.** Every buyer-facing surface should move toward browse → cart → checkout without detours or competing actions.
4. **Speed reads as freshness.** Loading behavior, checkout step count and delivery promises all carry the same "tươi" promise; sluggishness breaks it.
5. **Playful, never fake.** The voice can be loud, but claims, scarcity and proof must be real or clearly demo.
