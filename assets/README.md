# MUSTEX site assets

Current files:

- `favicon.svg` — browser tab icon (brand mark).
- `og.png` — 1200×630 social share image used by Open Graph / Twitter cards.

## Dropping in real app screenshots later

The product visuals on the site are currently built in HTML/CSS (clearly illustrative).
To swap in real App Store screenshots:

1. Export PNGs at 2× (e.g. 1179×2556 for 6.1" iPhone) into `assets/screens/`,
   named by what they show, e.g.:
   - `screens/home.png`
   - `screens/upload.png`
   - `screens/analyzing.png`
   - `screens/verdict.png`
   - `screens/share-card.png`
2. In `index.html`, each CSS phone mockup is wrapped in a
   `<div class="phone" data-screen="...">`. Replace the inner markup of a phone
   with `<img src="assets/screens/<name>.png" alt="...">` — the `.phone img`
   rule in `styles.css` already handles sizing and corner rounding.
3. Keep images lazy-loaded: `loading="lazy"` (the hero image should NOT be lazy).

If you replace `og.png`, keep it 1200×630.
