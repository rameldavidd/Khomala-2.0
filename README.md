# Khomala Website — Reorganized for Mobile & Categories

## What changed

The old site was one very long scrolling page with every photo (featured, families,
design details, community) stacked on top of each other. On a phone that meant a lot
of scrolling and no clear way to jump straight to "show me men's" or "show me women's."

The new site keeps everything in **one fast-loading HTML file**, but behaves like
separate pages:

- **Home** — hero, three big tappable category tiles (Men / Women / Family), our story,
  mission, services, how to order, and contact. No long photo grid on the homepage.
- **Men** — its own page with a short intro and a gallery of men's shirts, vests, and sets.
- **Women** — its own page with a gallery of dresses and accessories.
- **Family** — its own page with a gallery of couples, parents, and children sets.

Tapping a category tile or nav link instantly switches to that page (no reload), and a
**Back to Khomala** button returns home. Each category also has its own shareable link
(e.g. `yoursite.com/#men`), so you can post a direct link to just the men's photos.

## Why one file instead of men.html / women.html / family.html

This keeps the whole site loading fast (one request) while still feeling like separate
pages with their own URLs, back-button support, and instant switching — important on
slower mobile connections.

## Photo categorization

All existing photos were sorted by what's shown in the photo:

- `assets/images/men/` — 8 photos (solo men's/boys' attire, shirts, vests, sets)
- `assets/images/women/` — 24 photos (solo women's/girls' dresses and accessories)
- `assets/images/family/` — 18 photos (couples, parents with children, group/community shots)
- `assets/images/hero/`, `story/`, `orders/` — unchanged, used on the homepage only

If any photo should move to a different category, just say which photo and where it
should go — the filenames are numbered sequentially (e.g. `men-look-03.jpg`) so they're
easy to point to.

## Mobile improvements

- Category photo grids show **2 photos per row on phones** (not 1), so browsing is fast
  without endless single-column scrolling.
- Larger tap targets, simplified navigation menu, faster perceived load (no giant single
  gallery of 60+ photos on one page anymore).
- Same WhatsApp ordering flow, now with category-specific message text (e.g. tapping
  "Order a Men's Piece" pre-fills a men's-specific WhatsApp message).

## Hosting

Same as before — upload the contents of this folder to GitHub Pages (or any static host),
with `index.html` at the top level of the repository. No build step, no dependencies.
