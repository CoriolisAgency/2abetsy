// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

/**
 * Custom domain (default): https://2abetsy.com  → base /
 * GitHub project path only: ASTRO_BASE=/2abetsy/ ASTRO_SITE=https://coriolisagency.github.io
 */
const base = process.env.ASTRO_BASE || "/";
const site = process.env.ASTRO_SITE || "https://2abetsy.com";

// @ts-check
export default defineConfig({
  site,
  base,
  trailingSlash: "never",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
