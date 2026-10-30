# TableTap — Client Demo

A standalone, self-contained demo of the TableTap ordering experience, built
from the Figma **"Customer Facing Website"** screens (the invented venue
**The Boathouse**). It runs entirely in the browser — **no backend, no
Supabase, no real payments** — so it's safe to show clients and to leave
behind as a link. It is completely separate from the main TTCode app.

## What's in it

A first **"Choose demo"** screen lets the viewer pick a flow:

- **Scan & order at your table** — the full dine-in QR flow:
  Home → Menu (categories, add to cart, toast) → Cart (shared table cart,
  quantities) → Pay your bill → **split by item / divide equally / pay in
  full** → Payment (method) → Success → **live order tracking** (auto-advances
  through Placed → Accepted → Preparing → Ready → Served).
- **Curbside** — placeholder "coming soon" screen until those designs are added.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build the shareable / leave-behind version

```bash
npm run build      # outputs static files to ./dist
npm run preview    # preview the production build locally
```

`dist/` is plain static files with relative paths — drop it on any static host
(Vercel, Netlify, GitHub Pages, S3) or open it directly. Routing is
hash-based so it works from any path with no server config.

## Notes

- **Fonts:** uses the real product font **Satoshi** (plus Clash Display for the
  "TABLE TAP" eyebrow), loaded from Fontshare in `index.html`. Needs internet
  the first time to fetch the font; everything else is local.
- **Food photos:** the menu currently uses styled placeholder tiles. To use the
  real Boathouse photos, export them from the Figma menu screens and either:
  - drop them in `public/` and set each item's `img` in `src/lib/menu.ts`, or
  - hand them to the build and they'll be wired in.
- **Menu data:** all items, prices and copy live in `src/lib/menu.ts` — easy to
  edit for a specific prospect.
- **Cart / split state:** in-memory (`src/lib/store.tsx`); refreshing resets the
  demo, which is what you want between prospects.

## Structure

```
src/
  App.tsx              routes (hash router)
  lib/
    PhoneFrame.tsx     iPhone device chrome (status bar, Safari bar)
    boathouse.tsx      shared header + venue branding block
    menu.ts            menu data + helpers
    store.tsx          cart / table state
    icons.tsx          inline SVG icons
    MenuItemImage.tsx  photo / placeholder tile
  screens/             one file per screen
```
