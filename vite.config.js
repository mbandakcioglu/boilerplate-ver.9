import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
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

const assetsPath =
	projectSetup.projectType === "wordpress"
		? `/wp-content/themes/${projectSetup.projectName}/assets`
		: "/assets";

const removeLeadingSlash = (str) => str.replace(/^\/+/, "");

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

// import vituum from 'vituum'
// import { fileURLToPath, URL } from 'node:url'
// import pug from '@vituum/vite-plugin-pug'
// import pages from 'vituum/plugins/pages.js'
// import imports from "vituum/plugins/imports.js";

// export default {
//     resolve: {
//         alias: {
//             '@': fileURLToPath(new URL('./src', import.meta.url)),
//         }
//     },
//     base: './',
//     plugins: [
//         vituum(),
//         pug({root: '/src',}),
//         imports({
//             filenamePattern: {
//                 'src/styles': '+.css'
//             },
//             paths: ['/src/styles/*/**', '/src/scripts/*/**', '/src/assets/*/**'],
//         }),
//         pages({
//             dir: './src/pug/pages',
//             root: './src',
//             normalizeBasePath: true
//         },),
//     ],
//     assets: {
//         fileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'webp', 'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac', 'woff', 'woff2', 'eot', 'ttf'],
//     },
//     build: {
//         minify: true,
//         rollupOptions: {
//             input: [
//                 './src/pug/pages/*.{pug,html}',
//                 './src/styles/*.css',
//                 './src/scripts/**/*.{js,ts}',
//                 './src/assets/**/*.{svg,png,jpeg,jpg,webp,webm,mp4,mp3,webp,webm,woof,woof2,ttf}',
//             ],
//             output: {
//                 chunkFileNames: 'scripts/[name].js',
//                 entryFileNames: 'scripts/[name].js',
//                 assetFileNames: ({name}) => {
//                     if (/\.css$/.test(name ?? '')) {
//                         return '[name][extname]';
//                     }
//                     if (/\.(webp|png|jpg|jpeg|gif|ico|svg)$/.test(name ?? '')) {
//                         return 'assets/img/[name][extname]';
//                     }
//                     if (/\.(woff|woff2|ttf)$/.test(name ?? '')) {
//                         return 'assets/fonts/[name][extname]';
//                     }
//                     return 'assets/[name][extname]'
//                 },
//             }
//         }
//     },
// }
