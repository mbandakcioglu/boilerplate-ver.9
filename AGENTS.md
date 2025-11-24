# Memory Bank

## Project Identity
- WordPress-ready front-end boilerplate built on Vite 5, Vituum, Pug, and Tailwind CSS 4.
- Aims to streamline WordPress theme (or static HTML) builds with a modern asset pipeline and multi-page Pug templating.
- `dist/` output is post-processed for pretty URLs and WebP-first assets to match WordPress-friendly structures.

## Toolchain
- Vite dev server plus Vituum `pages` plugin for routing Pug files under `src/pug/pages`.
- Tailwind 4 pulled in via `@tailwindcss/postcss`; `src/styles/global.css` declares theme color tokens.
- Image optimization powered by `@vheemstra/vite-plugin-imagemin` with mozjpeg/pngquant and optional WebP variants.
- `postbuild.js` reorganizes HTML into folder-based routes, renames `.png.webp` or `.jpg.webp` outputs, and rewrites `/assets/img/*` refs to `.webp`.

## WordPress Integration Notes
- Configure `projectSetup` in `vite.config.js` (theme slug `projectName`, `projectType` `"wordpress"` or `"html"`).
- When `projectType` is `"wordpress"`, assets emit to `/wp-content/themes/<projectName>/assets/{scripts,styles,img,fonts}`.
- Update WordPress enqueue hooks to point at the compiled asset paths; pretty URL structure expects server rewrite support.

## Source Structure Highlights
- Base layout `src/pug/layouts/layout.pug` sets language `tr`, injects `/src/styles/app.css` and `/src/scripts/app.js`, and includes shared head/header/footer partials.
- Pages under `src/pug/pages/**` extend the layout, declare metadata in `block variables`, and render Tailwind-ready markup.
- JS entry `src/scripts/app.js` bootstraps component modules (`test`, `components/form`, placeholder `slider`).
- CSS entry `src/styles/app.css` imports Tailwind and scoped styles; component/page overrides live under `src/styles/components|pages`.

## Usage Workflow
- `npm install`
- `npm run dev` to start the dev server at `localhost:8000`.
- `npm run build` triggers Vite build followed by `node postbuild.js`; inspect `dist/` before deploying to WordPress.

## Open Questions
- Confirm the default WordPress theme slug and enqueue strategy you use so we can capture it here.
- Note any typical WordPress-specific assets (e.g., `editor-style.css`, `acf-json`, custom Gutenberg blocks) that should be documented next.
