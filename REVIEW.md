# Experience review — 2026-10-18

## Scope

Only `theater-personal-archive`. Existing content, user assets, and the independently configured GitHub Pages destination remain intact. Earlier archive repositories are not part of this change.

## First experience pass

- TIDAL ARCHIVE: an original procedural ambient composition, built from oscillators, a low-pass filter and a quiet non-feedback delay. No recordings, external music downloads, or automatic playback. The player always offers pause and volume. Page hiding/navigation stops playback; returning does not restart it.
- Opening retains its established 4.4-second choreography and now names the three visual phases. Skip, Escape and Enter all dismiss it. Explicit replay remains the only way to override reduced-motion preference for the opening.
- Peripheral chapter instruments, pointer-local illumination and directional link feedback use the existing silver/crimson visual language. No new character art or fake project data.
- Hero ambient drawing is capped at 30 fps with time-based pointer interpolation. Chapter rotations pause offscreen, when hidden, and when motion is disabled.
- Reading progress is passive. Content and project navigation remain usable without JavaScript.
- Mobile navigation isolates background content; original inert values are restored. Click-effect audio handles rapid restart races and closes when hidden. Motion-off now also disables root smooth scrolling.

## Verification

- `npm run build`: passed.
- `npm test`: five generated HTML pages/resources/anchors; shared player markup; mocked audio lifecycle/race/cleanup/unsupported behavior passed.
- Separate jsdom state checks passed: mobile inert restoration, Escape, Enter/replay, reduced-motion override, keyboard project switching, search empty/dismiss, chapter decorations. These are DOM checks, not rendering checks.
- Command-launched Chromium and cross-process localhost preview were blocked by the cloud sandbox. A native cloud-terminal preview bridge enabled actual browser review. Desktop 1180px and narrow 333px checks passed for overflow, music controls, search/escape focus restoration, project deep-links, drawer close/focus/inert restoration, reduced-motion root scrolling and Enter opening dismissal. Review found and fixed stretched tablet tags, missing arrow glyphs, and an obscured mobile close toggle.
- Native tab-switch visibility was inconclusive: the cloud browser continued reporting `visible` after switching tabs. Hidden-page suspension is covered by deterministic event tests, not claimed verified through native backgrounding. Waveform and subjective listening are not yet verified.
- Independent one-hour mocked audio lifecycle simulation remained bounded at 46 live nodes and one scheduler timer. User pause fades over 40ms; hidden/page exit deliberately disposes immediately to avoid background-timer leaks.

## Next checks

1. More native viewport and long-dwell checks; fixed music deck and sidebar smoke tests already pass at 333px.
2. Actual audio output and long-dwell hidden/visible behavior.
3. Rapid project/replay/search/menu sequences; touch targets, keyboard focus and no-JS reading.
4. Exact-commit Pages workflow and live-site validation after publication.

## Native article-navigation pass

- Same-origin archive/article navigation now uses optional native cross-document View Transitions. The outgoing text fades for 100ms before the incoming geometric reveal begins (220ms), avoiding overlapping headings. Links, browser history, back/forward cache and scroll restoration remain browser-native.
- Early `navigation.js` respects saved preferences before first paint, including system reduced motion. It skips transitions on both outgoing and incoming events when disabled, and uses in-page state when storage is unavailable. Unsupported browsers keep ordinary navigation.
- Native browser review verified both enabled and disabled archive/article/Back/Forward flows. Article scrollY 756 and reading progress 0.7682926829 restored exactly after settled history navigation. Music returns paused, no opening replay, no inert shell.
- Script-free fixtures (generated only in ignored `dist`, removed by build) verified readable home/article layouts, all three projects visible, and mobile fallback navigation at 500px. This is a script-free HTML fixture test, not browser-wide JavaScript disabling.
- Browser timing/animation instrumentation was unavailable in the sanitized browser read scope. No first-paint or browser frame-rate metric is claimed. `tests/navigation.cjs` adds deterministic gate coverage without intercepting navigation.

## Short viewport and synthesis validation

- Fixed keyboard focus wrapping in the short mobile drawer: native focus scrolling now brings Close or the final sound control into view, and opening starts at Close. Native 806×384 checks verified forward and reverse wrapping (Close at y13–57, sound at y263–295), with no hidden focus.
- Functional paper-section metadata now uses #59655b against #e8e5dd (solid-color contrast 4.85:1); project tags are 9px and tab metadata 8px. Native 333px/500px checks showed no clipping or horizontal overflow. This is targeted contrast work, not a claim of complete WCAG conformance.
- Actual browser OfflineAudioContext rendered the production soundtrack (SHA-256 `14034c72642b1a17e321d55594f1d1bd63b5b1b22354510a59f7a3efc29a6d92`) for 60 seconds at 44,100Hz, 2,646,000 frames/channel, 78 oscillators. The fixture ran the actual source with a virtual 250ms scheduling clock; no audible playback.
- At 35%: RMS 0.00304027, peak 0.02200138, maximum adjacent-sample delta 0.00099897. At 100%: RMS 0.0163081167, peak 0.118016049, maximum adjacent delta 0.00535849668. Both had zero nonfinite or full-scale samples, and identical dual-mono channels. This confirms finite, unclipped synthesis and an amplitude range of about 5.36×, not perceptual loudness or musical taste. Gain remains unchanged pending real listening feedback.
