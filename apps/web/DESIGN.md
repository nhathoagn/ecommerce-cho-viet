---
name: Chợ Việt — Đèn lồng
description: Vietnamese goods lit like a night market — paper slips over bamboo ribs, one coral action, lamps on only where something is in stock.
colors:
  ground: "#f6f7fb"
  paper: "#ffffff"
  sunk: "#eef1f8"
  ink: "#0b0f16"
  band: "#0a0d14"
  teal: "#00cf9a"
  buy: "#ff5a1f"
  lemon: "#ffe14d"
  hot-start: "#ff2f6d"
  hot-end: "#ff9f1c"
  rule: "#e2e7f0"
  rule-strong: "#c8d0e0"
  muted-ink: "#5b6472"
  night-ground: "#07090f"
  night-slip: "#10131c"
  night-rule: "#1d2230"
  ok: "#0e9f6e"
  warn: "#b45309"
  bad: "#d92d20"
  lamp-ink: "#241a02"
  lime: "#ccff3d"
  flame: "#ff2f6d"
  flame-soft: "rgb(255 47 109 / 0.55)"
  ember-deep: "rgb(255 95 69 / 0.2)"
typography:
  display:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  display-sm:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline-sm:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  section:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  price:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "0em"
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  body-sm:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  caption:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  caption-sm:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0em"
  label:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.14em"
  label-xs:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.16em"
rounded:
  xs: "4px"
  sm: "4px"
  md: "6px"
  lg: "10px"
  xl: "14px"
  circle: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "40px"
  4xl: "64px"
components:
  slip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.rule}"
    shadow: "0 18px 34px -24px rgb(24 34 28 / 0.45)"
  slip-lit:
    border: "1px solid color-mix(in oklab, {colors.lamp} 55%, {colors.rule})"
    shadow: "0 0 42px -8px rgb(255 192 33 / 0.28)"
  band:
    backgroundColor: "{colors.band}"
    textColor: "#f7f6ef"
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "#fff8f4"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "#f7f6ef"
    rounded: "{rounded.md}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    border: "1px solid {colors.rule-strong}"
    rounded: "{rounded.md}"
  button-lamp:
    backgroundColor: "{colors.lamp}"
    textColor: "#1c1508"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.rule-strong}"
    rounded: "{rounded.md}"
    height: "44px"
  pill:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    border: "1px solid {colors.rule}"
  note-bad:
    backgroundColor: "#ffe1d6"
    textColor: "{colors.bad}"
    border: "1px solid rgb(192 42 8 / 0.4)"
---


# Design System: Chợ Việt — Đèn lồng

## Overview

**Creative North Star: "Đèn lồng" (night-market light).**

A cool, high-contrast shelf lit like a night market: goods are cards laid on a light neutral ground, and the room decides what you notice. The palette is deliberately cold and electric — near-white ground, near-black bands, one teal for action, one lemon for highlights and one lime for availability — so nothing reads as aged paper. Depth comes from one soft shadow; colour comes from the product, the state and the single accent per screen.

**Key Characteristics:**

- Paper slips, not cards: 1px rules, 4px corners, a soft shadow that reads as a slip laid on a table.
- Ribs drawn as one repeating 1px line pattern (`ribs`), never as a texture image.
- A single ink band per screen: hero, promo strip, footer, auth page. No blur, no glass, no translucency anywhere.
- One heavy Vietnamese grotesk (Be Vietnam Pro 800) carries display, headings and numbers. Everything else is small and quiet.
- `lit` is a state, not decoration: in stock and active surfaces glow; absent stock does not.
- Theme is a real choice, persisted, and both themes are designed — not inverted.

## Colors

The palette is paper and ink with two controlled lights. Ember is the only "action" color; amber is the only "available" color and lives on ink grounds or as a lamp glow.

### Primary

- **Buy orange** (`#ff5a1f` day, `#ff6a33` night, label `#2a0d00`): reserved for the purchase action only — "Mua ngay", "Thanh toán", "Thêm vào giỏ". It is the loudest colour on any card and never used for anything else, so the eye learns it in one screen. On a hot product the button also carries a warm glow.
- **Teal** (`#00cf9a`): every other action — the cart, "Đăng ký", the active tab underline, links. Bright and cool, with near-black ink on top so contrast stays high; never used as a large background.
- **Ink** (`#0f1613`): all text, and the ground of every band. Never pure black.
- **Hot flame** (`#ff2f6d → #ff9f1c`): the only gradient in the system, and only on products whose data is genuinely urgent.

### Secondary

- **Lemon** (`#ffe14d` day, `#ffe87a` night): the highlight — hero CTA on a band, the headline accent word, price tags, active filter chips, the search button. Never as body text or a page fill.
- **Lime** (`#ccff3d`): availability only — the "sẵn hàng" pill and the luminous edge on a lit card.
- **Ground** (`#f6f7fb`): a cool near-white, never pure white so cards separate from it without a heavy border.
- **Paper** (`#ffffff`): every slip. The only pure white in the system.

### Neutral

- **Sunk** (`#f2efe4`): recessed sections, skeleton blocks, unlit wells.
- **Rule** (`#e6e1d2`) and **Rule strong** (`#cfc8b4`): the two border weights. All borders are 1px.
- **Muted ink** (`#5f6355`): captions, metadata, labels.
- **Night ground** (`#070b09`) and **Night slip** (`#121a16`): the dark theme; slips are *lighter* than the ground so they read as lit paper, never as holes. Coral lifts to `#ff6a45`, lamp to `#ffd24a`, fresh to `#d6ff62`.

### Named Rules

**The One Light Rule.** Teal, lemon and lime never compete on one surface. Teal marks the action, lemon the highlight, lime the availability; at most two of them are loud per screen. At most two of the three appear on one screen, and never in the same row.

**The Lamp Is a State Rule.** Glow belongs to real availability and real selection. A decorative glow on an out-of-stock item is a lie; the product goes unlit and desaturates.

## Typography

**One Family:** Be Vietnam Pro, 400–800. Vietnamese diacritics are part of the identity; do not swap in a display face that cannot set `Đ`, `ắ`, `ộ`.

**Character:** heavy, tight, and confident at display sizes; light and small everywhere else. The contrast between a 64px headline and a 10.5px label is the whole hierarchy — there is no middle ground and no second voice.

### Hierarchy

Fourteen steps, no free-form sizes. Anything off this list is a bug.

- **Display** 64 / 44px (800, −0.035em): hero headline, auth page title, one band per screen.
- **Headline** 40 / 32px: page titles on catalog, product, orders; seller page titles at 32.
- **Section** 28px: "Hôm nay có gì", "Danh mục", "Người đứng sau món hàng".
- **Title** 24 / 20px: card feature titles, panel titles, dialog titles.
- **Price** 17px semibold: the number on a price tag; product-detail price steps up to 28–32px.
- **Body** 16 / 15px: paragraphs; 15px is the default body on buyer pages, 13px inside dense seller rows.
- **Caption** 13 / 12px: metadata, helper text, SKU lines, field errors.
- **Label** 11 / 10.5px (800, 0.14–0.16em, uppercase): kickers, pill text, table headers.

### Named Rules

**The Tabular Money Rule.** Every price, count, total, countdown and stock figure uses the `num` utility (tabular numerals). Numbers are compared vertically; they must not shift.

**No Kicker Above a Headline Twice.** A `label-xs` kicker is allowed once per section as a wayfinding word ("Đang sáng đèn", "Nhà bán"). It never restates the headline.

## Layout

One shelf: `max-w-6xl` (1152px), centred, 16px gutters on mobile and 20px from `sm`. Bands are the only full-bleed surfaces.

Buyer surfaces breathe: 48–64px between sections, grids of 2 (mobile) / 3 (md) / 4 (lg) with 12–16px gaps. Seller surfaces tighten: 20px gaps, 13–14px type, rules instead of whitespace.

The header is a paper bar with a ruled category rail underneath; the hero band sits directly below it. Product detail splits 1fr / 420px with the buy panel sticky on desktop.

### Named Rules

**The Band Boundary Rule.** A band is either the first thing on a page or the last. Two bands never sit adjacent without paper between them.

## Elevation & Depth

**Slips, not glass.** Depth is one soft, wide, low shadow under a paper slip plus a 1px rule. Hovering a slip lifts it 2px and, for in-stock goods, lights it. Nothing else moves.

### Shadow Vocabulary

- **Slip** (`0 18px 30px -22px rgb(107 90 60 / 0.55)`): every slip.
- **Slip at night** (`0 22px 40px -26px rgb(0 0 0 / 0.8)`): the same slip in dark mode.
- **Lit** (`0 0 0 1px lamp-soft, 0 0 42px -8px lamp-soft`): selected or available paper.
- **Lift** (`translateY(-2px)`): hover on interactive slips only, 200ms.

### Named Rules

**The No Glass Rule.** No backdrop blur, no translucent panels, no frosted surfaces — the previous world is retired and does not come back through a "modern" effect.

## Shapes

Paper rectangles with 3–8px corners. Everything pressable or typeable is a soft rectangle. Full-round shapes exist in exactly two places: the brand mark and avatars.

### Named Rules

**The No Pill Rule.** Pills are retired: status, filters, tags and prices are rectangular slips with a 3–4px radius. A rounded-full button is a bug.

## Components

### Buttons — printed labels

One flat block with a hairline border in the same hue and a 1px inner white highlight, so it reads as a printed label glued to the page. No texture, no drop shadow, no second edge — colour and weight carry it. Radius 7px, heights 36/44/48px, 13–15px semibold, icon slots at 16px.

- `buy`: purchase orange fill (`#ff5a1f`) with a near-black label and a warm drop glow. Only ever on a purchase.
- `primary`: teal fill (`#00cf9a`) with a warm near-black label (`#2a1206`) and a coral border; hover mixes 8% white into the fill, active drops to 95% brightness.
- `lamp`: amber fill, dark label, amber border — band surfaces and seller header only.
- `outline`: paper fill, `rule-strong` border, inner highlight; hover darkens the border to ink.
- `on-band`: transparent with a `--band-rule` border, inherits band text; the only secondary allowed on an ink band.
- `ink`: solid ink with paper label, for dense seller rows only.
- `ghost` / `quiet`: no fill until hover.
- `danger`: paper fill, `bad` text and border, `bad-soft` wash on hover.
- `hot`: the flame. Gradient `#ff6a33 → #ff8a3d → #ffb347`, dark label, and a blurred `#ff8a3d` halo behind it breathing on a 2.8s cycle (halo is `flame-soft` at 55% fading through `ember-deep`). Reserved for products whose data is genuinely urgent — a discount of 25% or more, or five units or fewer left.
- `new`: lime `fresh` fill with a soft lime halo, no animation. Used only where a record is under 14 days old.

### Product slips: heat

Each product slip computes one heat state from data it actually has: **hot** (deep discount or nearly empty shelf) → flame badge on the photo plus a `hot` buy button; **new** (under 14 days) → lime "Mới" badge, primary button; otherwise the plain coral button. Never hotter than the data: no "bán chạy" label without sales records.

### Promise blocks

The four service blocks under a description are tinted cards — sky for delivery, lime for checking-on-arrival, amber for storage, lilac for the store — each a 40px coloured icon tile plus a 15px title. Fill is 15% of the hue over paper, border 55% over the rule.

Disabled drops to 45% and keeps its shape. Loading shows `Đang xử lý…` in tabular numerals, never a spinner.

### Paper slip (`BasePaper` / `slip` utility)

The repeating container: paper fill, 1px rule, 4px radius, slip shadow. Add `lit` for in-stock or selected. Panels pad 20px; product cards pad 10px.

### Pills (`BasePill`)

10.5px uppercase, 3px radius, 1px border, tone-specific tint (`ok`, `warn`, `bad`, `lamp`, `ink`, `neutral`). Maximum three per card. Hue carries state, never decoration.

### Field errors (`BaseFieldError` + `BaseLabel required` + `BaseInput :invalid`)

Browser validation bubbles are banned: every form is `novalidate` and validates in JS (`@/lib/form`). A failed field gets `:invalid` (bad border + 20% bad ring), an inline `BaseFieldError` line with a 14px alert icon directly under it, focus moves to the first failing field, and the message names the fix ("Nhập email.", "Số tiền tối thiểu 10.000₫."). Server errors stay a `BaseNote tone="bad"` summary at the top of the form. Required fields mark their label with a coral asterisk and nothing else.

### File field (`BaseFileField`)

A ruled paper row: 36px icon tile, file name or hint, and a bordered "Tải ảnh lên" button. The native `<input type="file">` is `sr-only`; its default "Choose File / No file chosen" string never reaches the screen.

### Notes (`BaseNote`)

Inline message block used for errors and confirmations: soft tinted fill, 1px border of the same hue, 14px text. Replaces every alert/dialog-based message.

### Inputs (`BaseInput`, `BaseTextarea`, `BaseSelect`, `BaseCheckbox`, `BaseLabel`)

44px tall, paper fill, 1px rule-strong border, 4px radius, 14px text. Focus is a 2px coral ring at 25% plus an ember border. Labels sit above the field in `label-xs`.

### Overlays (`BaseDialog`, `BaseSheet`)

Native `<dialog>` elements with an ink backdrop. Everything on paper, no rounded corners beyond 4px. Dialogs are for destructive confirmation and address editing only; browsing never opens a modal.

### Product slip (signature)

A 190–320px paper slip: a pastel paper well with the rib lattice over the photo, discount sticker rotated 3° at the top-right, store label in `label-xs`, two-line title, SKU, price 19px, then two pills (stock, delivery) and two buttons — outline "Thêm giỏ" and coral "Mua ngay". Out of stock: unlit, desaturated well, `bad` pill, disabled add. In stock: `fresh` pill.

### Bands (`band` + `ribs`)

Ink surface with a 1px rib pattern at 12–16% opacity. Hero left column: display headline, one lead paragraph, one lamp CTA and one outline CTA. Right column: three lanterns hanging from the top rib at staggered cord lengths.

### Seller channel

The same world with the lamps off: ink band header with store identity and three figures, then paper pages — a ledger on the left and a 420px page on the right that always shows the current selection. No amber emphasis, no glow, denser type and rules.

## Do's and Don'ts

### Do:

- **Do** build on `slip`, `band`, `ribs`, `label-xs`, `num` and the `--rule` tokens rather than new colors.
- **Do** let one coral action and one fresh availability per surface.
- **Do** design the night theme at the same time; check it before shipping.
- **Do** keep prices and counts in tabular numerals and set them larger than the copy beside them.
- **Do** use `@lucide/vue` icons at 16–18px for structure and glyphs for nothing else.

### Don't:

- **Don't** import `@/components/ui/*` — that library is deleted; compose from `@/components/base/*`.
- **Don't** use blur, translucency, glass, gradient fills or gradient text.
- **Don't** round buttons, inputs or tags into pills.
- **Don't** let the browser render a validation bubble — replace it with `BaseFieldError`.
- **Don't** put emoji in place of an icon or a label.
- **Don't** glow anything that is not available or selected.
- **Don't** fabricate sold counts, ratings, reviews or customer logos; the seeded data has none.
