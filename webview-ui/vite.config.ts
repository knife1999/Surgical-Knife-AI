import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue"; 
import { viteSingleFile } from "vite-plugin-singlefile";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const syncMainHtmlPlugin = () => ({
  name: "sync-main-html",
  closeBundle() {
    const outDir = resolve(__dirname, "../public/webview-ui");
    const indexHtml = resolve(outDir, "index.html");
    const mainHtml = resolve(outDir, "main.html");
    if (!existsSync(indexHtml)) return;
    copyFileSync(indexHtml, mainHtml);
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    viteSingleFile(),
    syncMainHtmlPlugin(),
  ],
  server: {
    port: 8081,
  },
  build: {
    outDir: "../public/webview-ui",
  },
});
