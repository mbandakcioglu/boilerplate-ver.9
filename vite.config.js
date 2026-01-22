import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import path from "node:path";
import { copyFile, mkdir } from "node:fs/promises";
import vituum from "vituum";
import pug from "@vituum/vite-plugin-pug";
import pages from "vituum/plugins/pages.js";
import imports from "vituum/plugins/imports.js";

import viteImagemin from "@vheemstra/vite-plugin-imagemin";

// The minifiers you want to use:
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import imageminWebp from "imagemin-webp";

import tailwindcss from "@tailwindcss/vite";

// Project settings
const projectSetup = {
	projectName: "my-theme", // WordPress theme name or HTML project name
	projectType: "html", // "html" or "wordpress"
};

// Script files to be copied to dist without being bundled, besides app.js
const standaloneScripts = [
	// e.g., "src/scripts/slider.js",
	"src/scripts/standalone-example.js",
];

// Style files to be copied to dist without being bundled, besides app.css
const standaloneStyles = [
	// e.g., "src/styles/pages/contact.css",
	"src/styles/standalone-example.css",
];

const assetsPath =
	projectSetup.projectType === "wordpress"
		? `/wp-content/themes/${projectSetup.projectName}/assets`
		: "/assets";

const removeLeadingSlash = (str) => str.replace(/^\/+/, "");
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Vite plugin to copy standalone script files from `src` to the final `dist` directory.
 * These scripts are not processed or bundled by Vite.
 */
const copyStandaloneScripts = () => ({
	name: "copy-standalone-scripts",
	apply: "build",
	async closeBundle() {
		if (!standaloneScripts.length) return;
		const outDir = path.resolve(
			"dist",
			removeLeadingSlash(assetsPath),
			"scripts",
		);
		await mkdir(outDir, { recursive: true });

		for (const scriptPath of standaloneScripts) {
			const src = path.resolve(scriptPath);
			const filename = path.basename(scriptPath);
			const dest = path.join(outDir, filename);
			await copyFile(src, dest);
			console.log(`[copy-standalone-scripts] Copied ${filename}`);
		}
	},
});

/**
 * Vite plugin to copy standalone style files from `src` to the final `dist` directory.
 * These stylesheets are not processed or bundled by Vite.
 */
const copyStandaloneStyles = () => ({
	name: "copy-standalone-styles",
	apply: "build",
	async closeBundle() {
		if (!standaloneStyles.length) return;
		const outDir = path.resolve(
			"dist",
			removeLeadingSlash(assetsPath),
			"styles",
		);
		await mkdir(outDir, { recursive: true });

		for (const stylePath of standaloneStyles) {
			const src = path.resolve(stylePath);
			const filename = path.basename(stylePath);
			const dest = path.join(outDir, filename);
			await copyFile(src, dest);
			console.log(`[copy-standalone-styles] Copied ${filename}`);
		}
	},
});

/**
 * Vite plugin to rewrite <script> tags for standalone scripts in the final HTML.
 * It changes the `src` attribute from the development path (e.g., /src/scripts/...)
 * to the production path (e.g., /assets/scripts/...) and removes the `type="module"` attribute.
 */
const rewriteStandaloneScripts = () => {
	let isBuild = false;

	return {
		name: "rewrite-standalone-scripts",
		enforce: "pre",
		configResolved(config) {
			isBuild = config.command === "build";
		},
		transformIndexHtml(html) {
			if (!standaloneScripts.length || !isBuild) return html;

			let transformed = html;
			for (const scriptPath of standaloneScripts) {
				const abs = path.resolve(scriptPath);
				const relFromSrc = path
					.relative(path.resolve("src"), abs)
					.split(path.sep)
					.join("/");
				const devSrc = `/src/${relFromSrc}`;
				const outSrc = `/${removeLeadingSlash(assetsPath)}/scripts/${path.basename(scriptPath)}`;

				const scriptRegex = new RegExp(
					`<script([^>]*?)\\s+src=["']${escapeRegExp(devSrc)}["']([^>]*)><\\/script>`,
					"gi",
				);

				transformed = transformed.replace(scriptRegex, (_match, pre, post) => {
					// We remove attributes that trigger bundling, like type="module"
					const cleaned = `${pre} ${post}`.replace(
						/\s*type=["']module["']/gi,
						"",
					);
					return `<script${cleaned} src="${outSrc}"></script>`;
				});
			}

			return transformed;
		},
	};
};

/**
 * Vite plugin to rewrite <link> tags for standalone stylesheets in the final HTML.
 * It changes the `href` attribute from the development path (e.g., /src/styles/...)
 * to the production path (e.g., /assets/styles/...).
 */
const rewriteStandaloneStyles = () => {
	let isBuild = false;

	return {
		name: "rewrite-standalone-styles",
		enforce: "pre",
		configResolved(config) {
			isBuild = config.command === "build";
		},
		transformIndexHtml(html) {
			if (!standaloneStyles.length || !isBuild) return html;

			let transformed = html;
			for (const stylePath of standaloneStyles) {
				const abs = path.resolve(stylePath);
				const relFromSrc = path
					.relative(path.resolve("src"), abs)
					.split(path.sep)
					.join("/");
				const devHref = `/src/${relFromSrc}`;
				const outHref = `/${removeLeadingSlash(assetsPath)}/styles/${path.basename(stylePath)}`;

				const linkRegex = new RegExp(
					`<link([^>]*?)\\s+href=["']${escapeRegExp(devHref)}["']([^>]*)>`,
					"gi",
				);

				transformed = transformed.replace(linkRegex, (_match, pre, post) => {
					return `<link${pre} href="${outHref}"${post}>`;
				});
			}

			return transformed;
		},
	};
};

/**
 * Vite plugin for the preview server to mimic "pretty URL" behavior.
 * It redirects requests from `/about` to `/about/` to match the post-build structure.
 */
const previewTrailingSlashRedirect = () => ({
	name: "preview-trailing-slash-redirect",
	configurePreviewServer(server) {
		const redirectToTrailingSlash = (req, res, next) => {
			const originalUrl = req.url || "/";

			// Separate query string (e.g., /about?x=1)
			const qIndex = originalUrl.indexOf("?");
			const pathname = qIndex >= 0 ? originalUrl.slice(0, qIndex) : originalUrl;
			const query = qIndex >= 0 ? originalUrl.slice(qIndex) : "";

			// Skip root and asset requests (paths with extensions)
			if (pathname === "/" || pathname.includes(".")) return next();

			// /about -> /about/ (let the browser do a real reload)
			if (!pathname.endsWith("/")) {
				res.statusCode = 308;
				res.setHeader("Location", `${pathname}/${query}`);
				return res.end();
			}

			return next();
		};

		// Try to add to the beginning of the stack to run before Vite's preview fallback
		if (Array.isArray(server.middlewares?.stack)) {
			server.middlewares.stack.unshift({
				route: "",
				handle: redirectToTrailingSlash,
			});
		} else {
			server.middlewares.use(redirectToTrailingSlash);
		}
	},
});

/**
 * Vite plugin for the dev server to handle trailing slashes.
 * Vituum pages work without trailing slashes (e.g., /about), so this redirects
 * requests from `/about/` to `/about` to maintain consistency during development.
 */
const devStripTrailingSlashRedirect = () => ({
	name: "dev-strip-trailing-slash-redirect",
	apply: "serve",
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			const originalUrl = req.url || "/";

			// Separate query string (e.g., /about/?x=1)
			const qIndex = originalUrl.indexOf("?");
			const pathname = qIndex >= 0 ? originalUrl.slice(0, qIndex) : originalUrl;
			const query = qIndex >= 0 ? originalUrl.slice(qIndex) : "";

			// Skip root and asset requests
			if (pathname === "/" || pathname.includes(".")) return next();

			// In dev, Vituum pages usually work without a slash (e.g., /about). Redirect /about/ -> /about.
			if (pathname.endsWith("/")) {
				res.statusCode = 308;
				res.setHeader("Location", `${pathname.slice(0, -1)}${query}`);
				return res.end();
			}

			return next();
		});
	},
});

/**
 * A robust custom plugin to fix the Vite error overlay.
 * This plugin intercepts error messages sent over the WebSocket and sanitizes them.
 * It ensures that essential properties (`message`, `stack`, `frame`) are always valid strings,
 * preventing the overlay from crashing with a "Cannot read properties of null" error,
 * which is a known issue when using certain plugins like Vituum that can malform error objects.
 */
const fixErrorOverlay = () => ({
	name: "fix-vite-error-overlay-robust",
	apply: "serve",
	configureServer(server) {
		const originalSend = server.ws.send;
		server.ws.send = (payload) => {
			if (payload.type === "error" && payload.err) {
				const { err } = payload;

				// Ensure essential properties are valid strings to prevent client-side crashes.
				if (!err.message) {
					err.message = "An unknown error occurred. Check the terminal for details.";
				}
				if (!err.stack) {
					err.stack = "Stack trace is not available.";
				}
				if (!err.frame) {
					err.frame = `(Error frame not available for file: ${err.id || 'unknown file'})`;
				}
			}
			originalSend(payload);
		};
	},
});

export default defineConfig(({ command }) => ({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	base: command === "build" ? "/" : "./",
	plugins: [
		fixErrorOverlay(), // Add our custom fix plugin at the very top.
		vituum(),
		tailwindcss(),
		pug({ root: "/src" }),
		imports({ paths: ["/src/styles/*/**", "/src/scripts/*/**", "/src/assets/*/**"] }),
		pages({
			dir: "./src/pug/pages",
			root: "./src",
		}),
		viteImagemin({
			plugins: {
				jpg: imageminMozjpeg(),
				png: imageminPngquant(),
			},
			makeWebp: {
				plugins: {
					jpg: imageminWebp({ quality: 85 }),
					png: imageminWebp({ quality: 85 }),
				},
			},
		}),
		rewriteStandaloneStyles(),
		rewriteStandaloneScripts(),
		copyStandaloneStyles(),
		copyStandaloneScripts(),
		// devStripTrailingSlashRedirect(), // Disabled due to potential conflict with subdirectory structure.
		previewTrailingSlashRedirect(),
	].filter(Boolean),
	assets: {
		fileExtensions: [
			"jpg",
			"jpeg",
			"png",
			"gif",
			"svg",
			"ico",
			"webp",
			"mp4",
			"webm",
			"ogg",
			"mp3",
			"wav",
			"flac",
			"aac",
			"woff",
			"woff2",
			"eot",
			"ttf",
		],
	},
	build: {
		minify: true,
		assetsInlineLimit: 0, // Set to 0 to prevent inlining of SVGs and other small assets.
		rollupOptions: {
			input: [
				"./src/pug/pages/**/*.{pug,html}",
				"./src/styles/*.css",
				"./src/scripts/app.js",
				"./src/assets/**/*.{svg,png,jpeg,jpg,webp,webm,mp4,mp3,webp,webm,woof,woof2,ttf}",
			],
			output: {
				entryFileNames: `${removeLeadingSlash(assetsPath)}/scripts/[name].js`,
				// chunkFileNames: `${removeLeadingSlash(assetsPath)}/scripts/[name].js`,
				assetFileNames: ({ name }) => {
					if (/\.css$/.test(name ?? "")) {
						return `${removeLeadingSlash(assetsPath)}/styles/[name][extname]`;
					}
					if (/\.(webp|png|jpg|jpeg|gif|ico|svg)$/.test(name ?? "")) {
						return `${removeLeadingSlash(assetsPath)}/img/[name][extname]`;
					}
					if (/\.(woff|woff2|ttf)$/.test(name ?? "")) {
						return `${removeLeadingSlash(assetsPath)}/fonts/[name][extname]`;
					}
					return "/[name][extname]";
				},
				// manualChunks: () => "app",
			},
		},
	},
	server: {
		// HMR hata katmanının etkin olduğundan emin olun.
		// Varsayılan olarak 'true'dur, ancak daha önce devre dışı bırakıldıysa
		// bu şekilde açıkça ayarlayabilirsiniz.
		hmr: { overlay: true },
		watch: {
			usePolling: true,
		}
	},
}));
