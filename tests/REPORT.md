# Playtest verification — 2026-09-29 UTC

Tested locally on macOS using Playwright 1.58.2 Chromium and WebKit 26.0.

| Viewport (CSS pixels) | Chromium | WebKit |
| --- | --- | --- |
| Desktop 1440 × 900 | Pass | Pass |
| Phone portrait 390 × 844 | Pass | Pass |
| Phone landscape 844 × 390 | Pass | Pass |
| Tablet portrait 768 × 1024 | Pass | Pass |
| Tablet landscape 1024 × 768 | Pass | Pass |
| Small phone portrait 320 × 568 | Pass | Pass |
| Small phone landscape 568 × 320 | Pass | Pass |

At every size the unchanged obstacle/gap layout was completed using all three
moves, with no respawns, in 20.000 simulated seconds. Verified 15 landings
(including stepping down from platforms), zero landing rotation, the checkpoint,
the home finish, replay, start-button visibility, and absence of JavaScript
errors. The server mounts the game at `/window-runner/`, exercising project
Pages asset paths. These runs use the opt-in QA adapter and deterministic
1/120-second simulation steps; they are not claims of human playtesting.

Additional regression checks in both engines:

- Complete course using browser keyboard events.
- Native emulated touchscreen tap and mouse pointer swipes in both directions.
- Vertical drag rejection, pointer cancellation, input buffer acceptance and expiry.
- Resize from 390 × 844 to 844 × 390 during a high flip: unchanged world X,
  vertical velocity and height above ground; upright landing afterward.
- P pause/resume, frozen paused physics, cleared stale inputs, and pause on blur.
- Side-impact and gap-fall respawns, including the halfway checkpoint.
- Scroll/gesture CSS and artwork-load failure with successful retry.

Chromium also received native emulated touch swipes in both directions and a
second concurrent touch through CDP. The second contact did not replace the
primary gesture.

A separate Chromium run used actual requestAnimationFrame timing at 390 × 844,
with keyboard events scheduled against runner position. It completed without a
failure at 20.000 simulated seconds (approximately 20 wall-clock seconds), with
no JavaScript errors. Reproduce with the repository-root HTTP server on port
8000 and `node tests/realtime.cjs`; optionally set `GAME_URL` to a URL ending in
`?test`.

Visually inspected the phone portrait play surface, short landscape menu, and
home finish. The original artwork, bright landing edges, visible road, and car
sill remain intact. The panorama and poles retain layer-space visibility bounds;
artwork must load before starting to prevent a background appearing mid-run.

Not tested on physical iPhone/iPad hardware, mobile Safari browser toolbar
transitions, real pinch/edge gestures, notches, Bluetooth/audio routing, or
low-end device performance. Desktop WebKit is useful coverage, not an iOS
certification. Those are the next checks for the public Pages playtest.
