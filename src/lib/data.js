// Données lues à la construction (data/build/site.json, produit par scripts/prepare_data.py).
import fs from "node:fs";
import path from "node:path";

let cache;
export function load() {
  if (cache) return cache;
  const s = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/build/site.json"), "utf-8"));
  for (const c of Object.values(s.communes)) {
    if (c.parent && s.communes[c.parent]) c.parentRef = s.communes[c.parent];
  }
  cache = s;
  return s;
}
export const ehpadOf = (ids) => { const { ehpad } = load(); return ids.map((i) => ehpad[i]); };
export const gUrl = (e) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${e.nom} ${e.adr} ${e.cp} ${e.ville}`);
