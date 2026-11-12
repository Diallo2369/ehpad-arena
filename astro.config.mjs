import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import fs from "node:fs";

// Adresse définitive du site, à fournir au moment de la publication (variable SITE_URL).
// Sans elle, le site se construit sans plan du site ni adresses canoniques,
// et toutes les pages portent « noindex » : on ne risque pas de faire indexer une adresse provisoire.
const SITE_URL = process.env.SITE_URL || "";

// Pages marquées « noindex » : jamais dans le plan du site (comparaison, communes d'un seul EHPAD).
const EXCLUDE = new Set(["/404/", "/comparer/"]);
try {
  const s = JSON.parse(fs.readFileSync(new URL("./data/build/site.json", import.meta.url)));
  for (const c of Object.values(s.communes)) if (c.n < 2) EXCLUDE.add(`/ehpad/${c.slug}/`);
} catch {}

export default defineConfig({
  site: SITE_URL || undefined,
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "never" },
  compressHTML: true,
  prefetch: false,
  integrations: SITE_URL ? [sitemap({ filter: (p) => !EXCLUDE.has(new URL(p).pathname) })] : [],
  vite: { build: { assetsInlineLimit: 0 } },
});
