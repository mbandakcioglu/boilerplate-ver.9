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
import imageminPngquant from 'imagemin-pngquant';
import imageminWebp from "imagemin-webp";
import tailwindcss from "@tailwindcss/vite";


// Proje ayarları
const projectSetup = {
	projectName: "my-theme", // WordPress tema adı veya HTML projesi adı
	projectType: "wordpress", // "html" veya "wordpress"
};

// app.js dışında, bundle'a eklenmeden dist'e kopyalanacak script dosyaları
const standaloneScripts = [
	// ör: "src/scripts/slider.js",
	"src/scripts/standalone-example.js",
];

// app.css dışında, bundle'a eklenmeden dist'e kopyalanacak css dosyaları
const standaloneStyles = [
	// ör: "src/styles/pages/contact.css",
	"src/styles/standalone-example.css"
];

const assetsPath =
	projectSetup.projectType === "wordpress"
		? `/wp-content/themes/${projectSetup.projectName}/assets`
		: "/assets";

const removeLeadingSlash = (str) => str.replace(/^\/+/, "");
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const copyStandaloneScripts = () => ({
	name: "copy-standalone-scripts",
	apply: "build",
	async closeBundle() {
		if (!standaloneScripts.length) return;
		const outDir = path.resolve(
			"dist",
			removeLeadingSlash(assetsPath),
			"scripts"
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

const copyStandaloneStyles = () => ({
	name: "copy-standalone-styles",
	apply: "build",
	async closeBundle() {
		if (!standaloneStyles.length) return;
		const outDir = path.resolve(
			"dist",
			removeLeadingSlash(assetsPath),
			"styles"
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
					"gi"
				);

				transformed = transformed.replace(scriptRegex, (_match, pre, post) => {
					// type="module" vb. derlemeyi tetikleyen attribute'ları kaldırıyoruz
					const cleaned = `${pre} ${post}`.replace(/\s*type=["']module["']/gi, "");
					return `<script${cleaned} src="${outSrc}"></script>`;
				});
			}

			return transformed;
		},
	};
};

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
					"gi"
				);

				transformed = transformed.replace(linkRegex, (_match, pre, post) => {
					return `<link${pre} href="${outHref}"${post}>`;
				});
			}

			return transformed;
		},
	};
};

export default defineConfig(({ command }) => ({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	base: command === "build" ? "/" : "./",
	plugins: [
		vituum(),
        tailwindcss(),
		pug({ root: "/src" }),
		imports({
			filenamePattern: { "src/styles": "+.css" },
			paths: ["/src/styles/*/**", "/src/scripts/*/**", "/src/assets/*/**"],
		}),
		pages({
			dir: "./src/pug/pages",
			root: "./src",
			normalizeBasePath: true,
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
		assetsInlineLimit: 0, // SVG'lerin ve diğer küçük asset'lerin inline edilmesini engellemek için limiti 0 yapın.
		rollupOptions: {
			input: [
				"./src/pug/pages/*.{pug,html}",
				"./src/styles/*.css",
				"./src/scripts/app.js",
				'./src/assets/**/*.{svg,png,jpeg,jpg,webp,webm,mp4,mp3,webp,webm,woof,woof2,ttf}',
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
}));
