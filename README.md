# Window Runner

A small, portrait-first browser game about the runner imagined outside a 1990s car window. Sunset Block is a 20-second course with six obstacles, two gaps, a halfway checkpoint, and a “Made it home” finish. No build step or runtime dependencies.

## Play locally

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. For a phone on the same Wi-Fi, open `http://YOUR_COMPUTER_LAN_IP:8000` and allow local network access if prompted. Stop the server with Ctrl+C.

`dist/index.html` contains the interface, `dist/game.js` contains the course, controls, physics and drawing, and `dist/assets/neighborhood.png` contains the original artwork. Edit these files and refresh.

## Controls

- Tap / Space: jump.
- Swipe right / Right + Space: longer forward flip.
- Swipe left / Left + Space: higher back flip (needed for the brick wall).
- P / pause button: pause or resume. Switching apps pauses automatically.
- Music button: mute or unmute. Audio is optional.

Swipes activate after 28 CSS pixels of horizontal travel. Vertical drags and cancelled contacts do not jump. Inputs within 130 ms before landing are buffered; walking off an edge allows 90 ms of grace. The runner stays in view without a catch-up rule. Hitting an obstacle from the side or falling through a gap returns to the last crossing.

## GitHub Pages

Playtest: https://houseandrade.github.io/window-runner/

In repository **Settings → Pages**, choose **GitHub Actions** as the source. The Pages workflow publishes only `dist/`. It runs on changes to `dist/` or the workflow on `main`, and on the initial `playtest/browser-reliability` branch so the PR can be tested before merging. It can also be run manually from Actions. Once merged, remove the preview branch trigger if no longer needed. The workflow uses the `github-pages` environment; allow that branch if deployment protection is enabled.

All game URLs are relative, including the script and artwork, so `/window-runner/` works without rewriting paths. Reference files and test adapters are not separately deployed; the QA adapter in the game is opt-in via `?test`.

## Reference and verification

`reference/v0.2/` is the unchanged recovered V0.2 source and artwork. See `reference/README.md` for provenance. The older supplied HTML is also preserved there.

```sh
npm ci
npx playwright install chromium webkit
npm test
BROWSER=webkit npm test
```

Node 18+ is needed only for tests. The tests start their own local server under `/window-runner/`; screenshots go to ignored `test-results/`. See [tests/REPORT.md](tests/REPORT.md) for what was actually tested.

Known limitations: desktop Chromium and WebKit automation cannot certify physical iPhone/iPad Safari, pinch gestures, safe-area/browser-toolbar changes, audio routing, or touch latency. Test the Pages URL on those devices. The page intentionally disables selection, scrolling and zoom gestures during play. The panorama repeats over long/wide views; this pass preserves the original artwork. Backgrounded play pauses, and severe foreground stalls cap simulation time rather than skipping collisions.
