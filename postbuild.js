import { readdir, rename, stat, mkdir, readFile, writeFile } from "fs/promises";
import path from "node:path";

// Recursively processes HTML files to create "pretty URLs".
// e.g., about.html -> about/index.html
async function cleanHtmlUrls(dir) {
	const files = await readdir(dir);
	for (const file of files) {
		const fullPath = path.join(dir, file);
		const fileStat = await stat(fullPath);
		if (fileStat.isDirectory()) {
			// Recurse into subdirectories.
			await cleanHtmlUrls(fullPath);
		} else if (file.endsWith(".html") && file !== "index.html") {
			// Create a new directory name by removing the .html extension.
			const newDirName = file.replace(/\.html$/, "");
			const newDirPath = path.join(dir, newDirName);
			await mkdir(newDirPath, { recursive: true });
			// Move the file as index.html into the new directory.
			const newFilePath = path.join(newDirPath, "index.html");
			await rename(fullPath, newFilePath);
			console.log(`Moved ${file} -> ${newDirName}/index.html`);
		}
	}
}

// Recursively renames image files that have double extensions like .png.webp or .jpg.webp to just .webp.
// This is often a side-effect of image optimization plugins.
async function renameWebpFiles(dir) {
	const items = await readdir(dir);
	for (const item of items) {
		const fullPath = path.join(dir, item);
		const itemStats = await stat(fullPath);
		if (itemStats.isDirectory()) {
			// Recurse into subdirectories.
			await renameWebpFiles(fullPath);
		} else {
			// If the file ends with .png.webp or .jpg.webp, rename it.
			if (/\.(png|jpe?g)\.webp$/i.test(item)) {
				const newFileName = item.replace(/\.(png|jpe?g)\.webp$/i, ".webp");
				const newFullPath = path.join(dir, newFileName);
				console.log(`Renaming: ${fullPath} --> ${newFullPath}`);
				await rename(fullPath, newFullPath);
			}
		}
	}
}

// Recursively processes HTML files to update image references from .png/.jpg to .webp.
async function rewriteImageRefs(dir) {
	const items = await readdir(dir);
	for (const item of items) {
	  const fullPath = path.join(dir, item);
	  const itemStats = await stat(fullPath);
	  if (itemStats.isDirectory()) {
		// Recurse into subdirectories.
		await rewriteImageRefs(fullPath);
	  } else if (item.endsWith(".html")) {
		let content = await readFile(fullPath, "utf8");
		// Capture both absolute and relative image paths (e.g., "/assets/img/..." or "../assets/img/...")
		content = content.replace(/((?:\.\.\/|\/)?assets\/img\/[^"'\s>]+)\.(png|jpe?g)(?=["'\s>])/gi, "$1.webp");
		await writeFile(fullPath, content, "utf8");
		console.log(`Updated image refs in ${fullPath}`);
	  }
	}
  }

async function processOutput() {
	const outputDir = path.resolve("dist");
	await cleanHtmlUrls(outputDir);
	await renameWebpFiles(outputDir);
	await rewriteImageRefs(outputDir);
}

processOutput()
	.then(() => console.log("Postbuild processing complete."))
	.catch((err) => console.error("Postbuild error:", err));
