// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

/**
 * GitHub project Pages: https://coriolisagency.github.io/2abetsy/
 *   ASTRO_BASE=/2abetsy/  ASTRO_SITE=https://coriolisagency.github.io
 * Custom domain 2abetsy.com (root):
 *   ASTRO_BASE=/          ASTRO_SITE=https://2abetsy.com
 *
 * CI defaults to project Pages path so CSS works before DNS.
 * After custom domain is live, set secrets or change workflow env to `/` + 2abetsy.com.
 */
const base = process.env.ASTRO_BASE || "/2abetsy/";
const site = process.env.ASTRO_SITE || "https://coriolisagency.github.io";

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
