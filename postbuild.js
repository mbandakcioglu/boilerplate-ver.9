import { readdir, rename, stat, mkdir, readFile, writeFile } from "fs/promises";
import path from "node:path";

async function cleanHtmlUrls(dir) {
	const files = await readdir(dir);
	for (const file of files) {
		const fullPath = path.join(dir, file);
		const fileStat = await stat(fullPath);
		if (fileStat.isDirectory()) {
			await cleanHtmlUrls(fullPath);
		} else if (file.endsWith(".html") && file !== "index.html") {
			// Dosya adındaki .html kısmını kaldırarak yeni klasör adı oluşturuyoruz.
			const newDirName = file.replace(/\.html$/, "");
			const newDirPath = path.join(dir, newDirName);
			await mkdir(newDirPath, { recursive: true });
			// Dosyayı yeni dizinde index.html olarak taşıyoruz.
			const newFilePath = path.join(newDirPath, "index.html");
			await rename(fullPath, newFilePath);
			console.log(`Moved ${file} -> ${newDirName}/index.html`);
		}
	}
}

// Tek bir renameWebpFiles fonksiyonu tanımlıyoruz:
async function renameWebpFiles(dir) {
	const items = await readdir(dir);
	for (const item of items) {
		const fullPath = path.join(dir, item);
		const itemStats = await stat(fullPath);
		if (itemStats.isDirectory()) {
			// Alt dizinlere de gir
			await renameWebpFiles(fullPath);
		} else {
			// Eğer dosya adı .png.webp veya .jpg.webp ile bitiyorsa, dosya adını yeniden düzenle
			if (/\.(png|jpe?g)\.webp$/i.test(item)) {
				const newFileName = item.replace(/\.(png|jpe?g)\.webp$/i, ".webp");
				const newFullPath = path.join(dir, newFileName);
				console.log(`Renaming: ${fullPath} --> ${newFullPath}`);
				await rename(fullPath, newFullPath);
			}
		}
	}
}

// HTML dosyalarını recursive olarak işleyip görsel referanslarını güncelleyen fonksiyon
async function rewriteImageRefs(dir) {
	const items = await readdir(dir);
	for (const item of items) {
	  const fullPath = path.join(dir, item);
	  const itemStats = await stat(fullPath);
	  if (itemStats.isDirectory()) {
		await rewriteImageRefs(fullPath);
	  } else if (item.endsWith(".html")) {
		let content = await readFile(fullPath, "utf8");
		// İmaj referanslarında hem absolute hem relative yolları ("/assets/img/..." veya "../assets/img/...") yakalıyoruz
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
