# MUSTEX site assets

- `favicon.svg` — browser tab icon (brand mark).
- `og.png` — 1200×630 social share image.
- `screens/` — REAL app screenshots. Auto-wired: drop a PNG at the right
  filename and it instantly replaces the CSS mockup in that phone frame
  (script.js handles the swap; missing files fall back to the mockup).

## Screenshot slots currently wired in index.html

| File                  | Where it appears                |
|-----------------------|---------------------------------|
| screens/hero.png      | Hero phone (first viewport)     |
| screens/verdict.png   | "The Read" section result phone |

Export at 2× (e.g. 1179×2556). Portrait, full-screen captures. Keep them
CURRENT — outdated UI hurts more than the mockup.

To add more slots later, add inside any `.phone`:
`<img class="screen-img" src="assets/screens/<name>.png" alt="" loading="lazy" />`
