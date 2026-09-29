# Window Runner

A portrait-first 2D arcade platformer about the stick figure imagined outside a moving car window.

## Play locally

Run `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000.
No build tools or runtime packages are required.

## Controls

- Tap: normal jump
- Swipe right: long front flip
- Swipe left: high back flip
- Keyboard: Space; Right + Space; Left + Space; P to pause

## v0.2 — Sunset Block

A 20-second handcrafted course with one checkpoint. Pixel-art neighborhood background; separate bright collision-aligned foreground platforms; fixed layer-space pole visibility; upright landings; 130ms jump buffering; orientation-independent world physics. Audio is optional and cannot block startup.

`dist/` is the complete portable game. `dist/game.js` contains course geometry, controls, physics, audio and rendering. `dist/assets/neighborhood.png` is the original generated background artwork. The scenery is decorative; only foreground geometry collides.

The `.openai/hosting.json` file connects the private phone-testing Site. GitHub Pages can also serve `dist/` through an Actions workflow if enabled later.
