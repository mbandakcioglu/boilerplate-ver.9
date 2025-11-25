# WordPress-ready Vite + Pug + Tailwind Boilerplate

Base: https://github.com/danyalll1/Vite-Pug-boilerplate/tree/main

Modern asset pipeline for WordPress-friendly themes (or static exports) using Vite 5, Vituum Pug routing, Tailwind CSS 4, and an optimized post-build step that reshapes `dist/` for pretty URLs and WebP-first images.

## Features
- Vite dev server with Vituum `pages` plugin for multi-page Pug under `src/pug/pages`.
- Tailwind CSS 4 via `@tailwindcss/postcss` with tokens defined in `src/styles/global.css`.
- Image optimization (`@vheemstra/vite-plugin-imagemin`) plus WebP variants handled in `postbuild.js`.
- WordPress mode emits assets to `wp-content/themes/<projectName>/assets/...` when configured in `vite.config.js`.
- Clean HTML output reorganized into folder-based routes for WordPress-friendly URLs.

## Prerequisites
- Node.js 18+ recommended
- npm

## Getting Started
Install dependencies:
```
npm install
```

Run the dev server at `localhost:8000`:
```
npm run dev
```

Build for production (includes post-build rewriter):
```
npm run build
```

## Project Structure
- `src/pug/layouts/layout.pug` — base layout injecting `/src/styles/app.css` and `/src/scripts/app.js`.
- `src/pug/pages/**` — page entries; define metadata in `block variables` and extend the layout.
- `src/pug/includes|components|mixins` — shared fragments.
- `src/scripts/app.js` — JS entry that imports component modules.
- `src/styles/app.css` — Tailwind import and global styles; component/page overrides live in `src/styles/components|pages`.
- Assets referenced in Pug should start with `/src/...` (e.g., `/src/images` or `/src/assets`).

## Build Notes
- `postbuild.js` rewrites image references to WebP where available and reshapes HTML into folder-based routes to match WordPress-friendly structures.
- When `projectType` in `vite.config.js` is set to `"wordpress"`, emitted assets target `/wp-content/themes/<projectName>/assets/{scripts,styles,img,fonts}`.
- A custom copy pipeline watches two lists in `vite.config.js`: `standaloneScripts` and `standaloneStyles`. Any `/src/...` script or stylesheet added there is copied verbatim into `dist/<assets>/scripts|styles/` without getting bundled, and the helper plugins transparently rewrite the generated HTML so the `<script>`/`<link>` tags point at the WordPress-friendly paths.

## Standalone Assets
- Add page-specific JS files to `standaloneScripts` and keep invoking them in Pug via `script(src="/src/...")`. During the build the file is copied into `dist/.../scripts/` and `<script>` tags are rewritten to load the copied file (module attributes stripped so Vite ignores it).
- Do the same for one-off stylesheets with `standaloneStyles` and `link(rel="stylesheet" href="/src/...")`.
- Keep `/src/...` paths in your templates to ensure the dev server loads the source file before build-time rewriting takes over.

## TODO
- Document the default WordPress theme slug and enqueue strategy you use.
