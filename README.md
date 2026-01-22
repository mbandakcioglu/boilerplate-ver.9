# Modern Frontend Boilerplate (Vite + Vituum + Pug + Tailwind)

Base: https://github.com/danyalll1/Vite-Pug-boilerplate/tree/main

This is a modern frontend boilerplate built with Vite, Vituum, Pug, and Tailwind CSS. It's designed for the rapid development of static websites or WordPress themes, with a focus on performance, a clean project structure, and an optimized build process.

## ✨ Features

-   **Fast Development**: Leverages Vite's native ESM-based dev server for lightning-fast Hot Module Replacement (HMR).
-   **Static Site Generation**: Uses Vituum for powerful file-based routing and static site generation.
-   **HTML Templating**: Uses Pug for clean and powerful HTML templating.
-   **Styling**: Integrated with Tailwind CSS for a utility-first CSS workflow.
-   **Pretty URLs**: The build process automatically converts `about.html` into `about/index.html` for cleaner, extension-less URLs.
-   **Image Optimization**: Automatically optimizes JPG/PNG images and creates WebP versions during the build process. HTML references are updated to point to the new `.webp` files.
-   **Standalone Assets**: Easily include scripts and styles that should be copied to the build output without being processed or bundled by Vite.
-   **WordPress Integration**: Can be configured to build assets with paths suitable for a WordPress theme structure.

## 📂 Project Structure

```
├── dist/                  # Production build output
├── src/
│   ├── assets/            # Static assets (images, fonts, etc.)
│   ├── pug/
│   │   ├── components/    # Reusable Pug components
│   │   ├── layouts/       # Base Pug layouts
│   │   └── pages/         # Site pages (e.g., index.pug, about.pug)
│   │   └── ui/            # UI-related Pug files (e.g., style guide, pattern library)
│   ├── scripts/
│   │   ├── app.js         # Main JS entry point (bundled)
│   │   └── standalone-example.js # Example of a standalone script
│   └── styles/
│       ├── app.css        # Main CSS entry point (bundled)
│       └── standalone-example.css  # Example of a standalone stylesheet
├── postbuild.js           # Node script for post-build optimizations
├── tailwind.config.js     # Tailwind CSS configuration
└── vite.config.js         # Vite and plugin configuration
```

## 🚀 Getting Started

### Prerequisites

-   Node.js (LTS version recommended)
-   pnpm (or npm/yarn)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/mbandakcioglu/boilerplate-ver.9.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd <project-directory>
    ```
3.  Install dependencies:
    ```bash
    pnpm install
    ```

### Available Scripts

-   `pnpm dev`: Starts the Vite development server with HMR.
-   `pnpm build`: Builds the project for production. This includes asset optimization and runs the `postbuild.js` script.
-   `pnpm preview`: Starts a local server to preview the production build from the `dist` directory.

## ⚙️ Configuration

All main configurations are located in `vite.config.js`.

### Project Type

You can configure the build output paths for either a standard static site or a WordPress theme.

```javascript
// vite.config.js
const projectSetup = {
	projectName: "my-theme", // WordPress theme name or HTML project name
	projectType: "wordpress", // "html" or "wordpress"
};
```

-   `html`: Assets will be placed in `/assets/`.
-   `wordpress`: Assets will be placed in `/wp-content/themes/my-theme/assets/`.

### Standalone Scripts & Styles

If you have scripts or styles that should not be bundled with `app.js` or `app.css`, you can add them to the `standaloneScripts` or `standaloneStyles` arrays. These files will be copied directly to the `dist` folder, and the HTML links will be updated accordingly during the build.

This is useful for legacy scripts, third-party libraries that don't work well with bundlers, or page-specific assets.

```javascript
// vite.config.js

// Script files to be copied to dist without being bundled
const standaloneScripts = [
	"src/scripts/standalone-example.js",
];

// Style files to be copied to dist without being bundled
const standaloneStyles = [
	"src/styles/standalone-example.css"
];
```

To use them in your Pug files, simply link them as you would in development:

```pug
//- src/pug/pages/index.pug

link(rel="stylesheet", href="/src/styles/standalone-example.css")
script(src="/src/scripts/standalone-example.js")
```

The build process will automatically rewrite these paths to their final destination in the `dist` folder.
