# Tasbiul Islam Nibir — Portfolio

Personal portfolio for **Tasbiul Islam Nibir**, focused on MEAL/MERL, data, MIS, research and evidence-led decision making.

Live site: [tnibir.github.io](https://tnibir.github.io/)

## Structure

- `index.html` — semantic page content and metadata
- `styles.css` — responsive design, themes and reduced-motion support
- `script.js` — progressive interaction enhancements
- `galaxy.js` — scroll-responsive WebGL galaxy background
- `tests/` — browser-level portfolio content and interaction checks
- `assets/` — local portrait, résumé, favicon and galaxy model
- `vendor/three/` — pinned Three.js runtime, loader utilities and license

The site deploys directly from the `main` branch through GitHub Pages. Its progressive 3D background uses a locally vendored, pinned Three.js ES module; all primary content and navigation remain functional if WebGL is unavailable.

Run `npm install` once, then `npm test` to launch the browser checks against a local server.

## 3D model attribution

“[Need some space?](https://sketchfab.com/3d-models/need-some-space-d6521362b37b48e3a82bce4911409303)” by Loïc Norgeot, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
