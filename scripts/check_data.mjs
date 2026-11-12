// Bloque la construction si les données sont manifestement fausses ou incomplètes.
import fs from "node:fs";

const fail = (m) => { console.error("Données refusées : " + m); process.exit(1); };
if (!fs.existsSync("data/build/site.json")) fail("lancez d'abord npm run data:prepare");
const s = JSON.parse(fs.readFileSync("data/build/site.json", "utf-8"));
const E = Object.values(s.ehpad);
const nPrix = E.filter((e) => e.mois).length, nHas = E.filter((e) => e.has).length;

if (E.length < 7000) fail(`seulement ${E.length} EHPAD (attendu : plus de 7 000)`);
if (nPrix < 5000) fail(`seulement ${nPrix} EHPAD avec un prix complet (attendu : plus de 5 000)`);
if (nHas < 4000) fail(`seulement ${nHas} EHPAD évalués (attendu : plus de 4 000)`);
if (s.meta.unknownCommunes > 20) fail(`${s.meta.unknownCommunes} établissements sans commune reconnue`);
const slugs = new Set();
for (const e of E) {
  if (!/^\w{9}$/.test(e.id)) fail(`numéro FINESS invalide : ${e.id}`);
  if (/[?�]|Ã/.test(e.nom + e.adr)) fail(`texte mal encodé : ${e.nom}`);
  if (slugs.has(e.slug)) fail(`adresse en double : ${e.slug}`);
  slugs.add(e.slug);
  if (e.mois && (e.mois < 900 || e.mois > 12000)) fail(`prix impossible : ${e.nom} ${e.mois} €`);
  if (e.has) {
    if (!"ABCD".includes(e.has.n)) fail(`niveau invalide ${e.has.n}`);
    if (!(e.has.note >= 0 && e.has.note <= 10)) fail(`note impossible ${e.has.note}`);
    if (e.has.th.length !== 9 || e.has.th.some((v) => v < 1 || v > 4)) fail(`thèmes invalides : ${e.nom}`);
    if (e.has.ci > e.has.nci) fail(`exigences impossibles : ${e.nom}`);
  }
}
for (const c of Object.values(s.communes)) { if (slugs.has(c.slug)) fail(`adresse en double : ${c.slug}`); }
// Les grandes villes doivent être là
for (const code of ["75056", "13055", "69123", "31555", "06088", "44109", "35238"]) if (!s.communes[code]?.n) fail(`grande ville sans EHPAD : ${code}`);
if (s.nat.med < 1800 || s.nat.med > 3500) fail(`prix médian national invraisemblable : ${s.nat.med}`);
console.log(`Données OK : ${E.length} EHPAD, ${nPrix} avec prix, ${nHas} évalués, ${Object.keys(s.communes).length} communes.`);
