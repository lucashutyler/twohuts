# twohuts.com

Personal website of Lucas Hutyler.

Static site: no build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Layout

- `index.html` – the homepage: hero with the two huts, who I am, how I got here, what I'm building, and the second hut (its people list doubles as the no-JavaScript fallback)
- `projects.html` – one card per project
- `styles.css` – all styling
- `script.js` – hut captions (hover, tap, keyboard), the narrow-screen crop of the hero scene, the second-hut stage (name chips, walking visitors, auto-rotation), the sketch that draws itself on scroll, and the footer year
- `og.png`, `favicon.svg`, `favicon.png`, `apple-touch-icon.png` – link-preview image and icons
- `CNAME` – custom domain for GitHub Pages / Cloudflare Pages
