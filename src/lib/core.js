// Rendu de toutes les pages : fonctions pures qui renvoient du HTML, utilisées à la construction (Astro).
// Une seule source pour les textes et la mise en page : on modifie ici.

export const THEMES = ["Bientraitance et éthique", "Droits de la personne", "Projet d'accompagnement personnalisé",
  "Expression et participation", "Accompagnement à l'autonomie", "Accompagnement à la santé",
  "Continuité des parcours", "Ressources humaines", "Démarche qualité et gestion des risques"];
const LEVELS = "ABCD";
const LEVEL_TXT = { A: "le meilleur niveau", B: "le 2e niveau sur 4", C: "le 3e niveau sur 4", D: "le niveau le plus bas" };

// ---------- outils ----------
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nb = (s) => s.replace(/[   ]/g, " ");
export const eur = (n) => nb(Math.round(n).toLocaleString("fr-FR")) + " €";
export const eur2 = (n) => nb(n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + " €";
export const n1 = (v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const int = (v) => nb(Math.round(v).toLocaleString("fr-FR"));
export const ord = (n) => n + (n === 1 ? "<sup>er</sup>" : "<sup>e</sup>");
export const ordTxt = (n) => n + (n === 1 ? "er" : "e");
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export const dateFr = (s) => { if (!s) return ""; const [y, m, d] = s.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MONTHS[m - 1]} ${y}`; };
export const band = (v) => (v >= 9 ? "A" : v >= 8 ? "B" : v >= 6.5 ? "C" : "D");
const lv = (e) => (e.has ? LEVELS.indexOf(e.has.n) : 9);
export const plural = (n, s, p = s + "s") => (n > 1 ? p : s);

export const ficheUrl = (e) => `/etablissement/${e.slug}/`;
export const communeUrl = (c) => `/ehpad/${c.slug}/`;
export const depUrl = (d) => `/departement/${d.slug}/`;

// « en Ille-et-Vilaine », « dans le Nord », « à Paris »
const A_DEPS = new Set(["75", "974", "976", "975", "977", "978"]);
export function inDep(d) {
  if (A_DEPS.has(d.code)) return "à " + d.nom;
  return ({ 2: "dans le ", 4: "dans les ", 5: "dans l'" }[d.tl] ?? "en ") + d.nom;
}
// « à Rennes », « dans le 15e arrondissement de Paris »
export function inCity(c) {
  const m = c.nom.match(/^(Paris|Lyon|Marseille) (\d+)(e|er)$/);
  return m ? `dans le ${m[2]}${m[3]} arrondissement de ${m[1]}` : "à " + c.nom;
}

const ICON = {
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  pin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
};

// ---------- composants ----------
export const cnt = (v, fmt) => `<span data-count="${v}" data-fmt="${fmt}">${{ eur, n1, int }[fmt](v)}</span>`;

export function grade(e) {
  if (!e.has) return '<div class="grade g-na" title="Pas encore évalué par la HAS" aria-label="Pas encore évalué">–</div>';
  const v = e.has.note;
  return `<div class="grade g-${band(v)}" title="Note EHPAD Arena : ${n1(v)} sur 10" aria-label="Note ${n1(v)} sur 10">${n1(v)}</div>`;
}

export function ring(v) {
  const C = 213.6;
  return `<svg class="ring" viewBox="0 0 84 84" role="img" aria-label="${v == null ? "Pas encore évalué" : "Note " + n1(v) + " sur 10"}"><circle class="bg" cx="42" cy="42" r="34"/>${v == null ? "" : `<circle class="fg s-${band(v)}" cx="42" cy="42" r="34" stroke-dasharray="${C}" stroke-dashoffset="${(C * (1 - v / 10)).toFixed(1)}"/>`}<text x="42" y="51" text-anchor="middle">${v == null ? "–" : `<tspan data-count="${v}" data-fmt="n1">${n1(v)}</tspan>`}</text></svg>`;
}

export function searchBox(id = "q", label = "Renseignez une commune") {
  return `<form class="search" role="search" action="/" data-search>
    ${ICON.search}<input id="${id}" type="search" autocomplete="off" enterkeyhint="search" placeholder="${label}" aria-label="${label}" role="combobox" aria-expanded="false" aria-controls="${id}-s" aria-autocomplete="list">
    <div id="${id}-s" class="sugg" role="listbox" hidden></div></form>`;
}

// Graphique des prix : rien sous 5 établissements, une colonne par EHPAD jusqu'à 40, des tranches au-delà.
export function priceChart(list, { cur = null, place = "" } = {}) {
  const items = list.filter((e) => e.mois).sort((a, b) => a.mois - b.mois);
  const n = items.length;
  if (n < 5) return "";
  const lo = items[0].mois, hi = items[n - 1].mois;
  if (n <= 40) {
    const ci = cur ? items.findIndex((e) => e.id === cur) : -1, mid = Math.floor(n / 2);
    const title = ci >= 0 ? `Son prix parmi les ${n} EHPAD ${place} : ${ord(ci + 1)} moins cher` : `Les prix par mois ${place}, du moins cher au plus cher`;
    const cols = items.map((e, j) => {
      const on = j === ci, md = ci < 0 && j === mid, h = hi > lo ? Math.round(16 + ((e.mois - lo) / (hi - lo)) * 64) : 48;
      const lab = on ? "Cet EHPAD" : md ? "Médiane" : "";
      return `<a class="${on ? "on" : md ? "md" : ""}${j < n / 2 ? " l" : " r"}" style="--i:${j};height:${h}px" href="${ficheUrl(e)}" title="${esc(e.nom)} : ${eur(e.mois)} par mois" aria-label="${esc(e.nom)}, ${eur(e.mois)} par mois">${lab ? `<em style="height:${80 - h + 8}px"></em><span style="bottom:calc(100% + ${80 - h + 12}px)">${lab} : ${eur(e.mois)}</span>` : ""}</a>`;
    }).join("");
    return `<h2 class="sw-title">${title}</h2><div class="cols19" role="group" aria-label="Prix par mois des ${n} EHPAD ${esc(place)}">${cols}</div>
      <div class="cols-leg num"><span>Le moins cher<b>${eur(lo)}</b></span><span style="text-align:right">Le plus cher<b>${eur(hi)}</b></span></div>`;
  }
  // tranches de 200 €, dernière tranche ouverte
  const start = Math.floor(lo / 200) * 200, top = 3500;
  const edges = [];
  for (let x = start; x < Math.min(hi + 1, top); x += 200) edges.push(x);
  const bins = edges.map((x, i) => ({ x, last: i === edges.length - 1 && hi >= top, n: 0 }));
  if (hi >= top) bins.push({ x: top, last: true, n: 0 });
  const curE = cur ? items.find((e) => e.id === cur) : null;
  for (const e of items) { let b = bins.findIndex((b, i) => b.last ? e.mois >= b.x : e.mois >= b.x && e.mois < b.x + 200); if (b < 0) b = bins.length - 1; bins[b].n++; }
  const maxN = Math.max(...bins.map((b) => b.n));
  const curB = curE ? bins.findIndex((b) => (b.last ? curE.mois >= b.x : curE.mois >= b.x && curE.mois < b.x + 200)) : -1;
  const title = curE ? `Son prix parmi les ${n} EHPAD ${place} : ${ord(items.indexOf(curE) + 1)} moins cher` : `Combien d'EHPAD ${place} par tranche de prix`;
  return `<h2 class="sw-title">${title}</h2><div class="bins" role="img" aria-label="Nombre d'EHPAD ${esc(place)} par tranche de 200 euros">${bins.map((b, i) => `<div class="bin${i === curB ? " on" : ""}" style="--i:${i}"><b>${b.n || ""}</b><i style="height:${Math.round(4 + (b.n / maxN) * 76)}px"></i><span>${b.last ? int(b.x) + " +" : int(b.x)}</span></div>`).join("")}</div>
    <p class="cols-leg num"><span>Nombre d'EHPAD par tranche de 200 € par mois${curE ? " ; en orange, celle de cet EHPAD" : ""}.</span></p>`;
}

export function listRow(e, rank) {
  const h = e.has;
  const tags = [
    h ? `<span class="tag">Niveau officiel ${h.n} · évalué en ${h.d.slice(0, 4)}</span>` : '<span class="tag">Pas encore évalué par la HAS</span>',
    e.ash ? '<span class="tag ash">Aide sociale acceptée</span>' : "",
  ].join("");
  return `<li class="card row" data-id="${e.id}" data-lv="${lv(e)}" data-note="${h ? h.note : -1}" data-mois="${e.mois || ""}" data-ash="${e.ash ? 1 : 0}" data-nom="${esc(e.nom)}">
    ${grade(e)}
    <div class="row-main"><h3>${rank ? `<span class="rank num">${rank}</span>` : ""}<a href="${ficheUrl(e)}">${esc(e.nom)}</a></h3>
      <p class="meta">${esc(e.adr ? e.adr + ", " : "")}${e.cp} ${esc(e.ville)}</p>
      <div class="tags">${tags}</div>
      <label class="cmp"><input type="checkbox" data-cmp="${e.id}">Comparer</label></div>
    <div class="price num">${e.mois ? `<b>${eur(e.mois)}</b><small>par mois</small>` : "<small>Prix non déclaré</small>"}</div>
  </li>`;
}

export function rankedList(es, { id = "list" } = {}) {
  let r = 0, sep = false;
  const rows = es.map((e) => {
    let pre = "";
    if (!e.has && !sep) { sep = true; pre = '<li class="sep">Non classés : pas encore de résultat publié par la HAS</li>'; }
    return pre + listRow(e, e.has ? ++r : 0);
  }).join("");
  const n = es.length, nash = es.filter((e) => e.ash).length, nh = es.filter((e) => e.has).length;
  const tools = n > 1 ? `<div class="tools" role="group" aria-label="Filtres">
      <button type="button" class="chip" data-f="tous" aria-pressed="true">Tous (${n})</button>
      ${nash && nash < n ? `<button type="button" class="chip" data-f="ash" aria-pressed="false">Aide sociale acceptée (${nash})</button>` : ""}
      ${nh && nh < n ? `<button type="button" class="chip" data-f="eval" aria-pressed="false">Évaluation publiée (${nh})</button>` : ""}
      <label for="${id}-o">Trier par <select id="${id}-o" data-sort><option value="qual">Qualité</option><option value="qp">Rapport qualité-prix</option><option value="prix">Prix croissant</option><option value="cher">Prix décroissant</option><option value="nom">Nom</option></select></label>
    </div>
    <p class="hint">Classés par niveau officiel, puis par note. Cochez « Comparer » sur 2 ou 3 établissements pour les voir côte à côte.</p>` : "";
  return `<div data-list>${tools}<ul class="list" id="${id}">${rows}</ul></div>`;
}

const noteHelp = `<div class="acc" style="margin-top:18px"><details class="card"><summary><b>Comment la note est calculée</b><span>d'après l'évaluation officielle de la HAS</span></summary><div class="in">
  <p class="tx">La Haute Autorité de santé (HAS) classe chaque EHPAD évalué sur 4 niveaux, de A (le meilleur) à D. Pour départager les établissements d'un même niveau, nous calculons une note sur 10 à partir de la même évaluation : les 9 thèmes notés comptent pour 70 %, les 18 exigences essentielles respectées pour 30 %.</p>
  <p class="tx">Les établissements sont classés par niveau officiel, puis par note. La HAS évalue surtout l'organisation et la démarche qualité ; elle précise que ce premier cycle d'évaluation se prête mal aux comparaisons. Les établissements pas encore évalués ne sont pas classés.</p>
  <p class="tx"><a href="/a-propos/">Toute la méthode</a></p></div></details></div>`;

function tiles3(items) {
  return `<div class="tiles">${items.join("")}</div>`;
}

// ---------- pages ----------
export function renderHome({ nat, cities, regions }) {
  const p = (v) => (((v - 1500) / 2500) * 100).toFixed(1);
  return `<section class="band hero"><div class="wrap">
  <h1>Combien coûte un EHPAD près de chez vous ?</h1>
  <p class="lede">Prix, avis et aides pour chaque maison de retraite médicalisée.</p>
  ${searchBox("q")}
  <p class="near"><button type="button" class="link-btn" data-near>${ICON.pin}Autour de moi</button></p>
  <div id="near" class="near-list" hidden></div>
</div></section>
<section class="block"><div class="wrap">
  <h2>Les prix en France</h2>
  <div class="card fr">
    <div><div class="hero-num num">${cnt(nat.med, "eur")}</div><p class="fr-sub">par mois, avant les aides.<br>C'est le prix médian d'une chambre seule.</p></div>
    <div>
      <div class="picto" role="img" aria-label="Sur 10 EHPAD : 1 coûte moins de ${eur(nat.d1)}, 8 coûtent entre ${eur(nat.d1)} et ${eur(nat.d9)}, 1 coûte plus de ${eur(nat.d9)}">${[...Array(10).keys()].map((i) => `<i class="${i === 0 ? "lo" : i === 9 ? "hi" : ""}" style="--i:${i}"></i>`).join("")}</div>
      <ul class="leg3 num">
        <li><i class="lo"></i><span><b>1 EHPAD sur 10</b> coûte moins de <b>${eur(nat.d1)}</b></span></li>
        <li><i></i><span><b>8 sur 10</b> coûtent entre <b>${eur(nat.d1)}</b> et <b>${eur(nat.d9)}</b></span></li>
        <li><i class="hi"></i><span><b>1 sur 10</b> coûte plus de <b>${eur(nat.d9)}</b></span></li>
      </ul>
    </div>
  </div>
  <p class="src" style="margin-top:12px">Calcul EHPAD Arena d'après les prix déclarés à la CNSA par ${int(nat.np)} établissements, sur ${int(nat.n)} EHPAD en France.</p>
</div></section>
<section class="block"><div class="wrap">
  <h2>Comment ça marche</h2>
  <ol class="how">
    <li class="card"><div class="vis" aria-hidden="true"><div class="v-col"><div class="v-search">${ICON.search}Rennes<i class="caret"></i></div><div class="v-sugg"><b>Rennes</b> (35)<span>20 EHPAD</span></div></div></div><div class="txt"><b>Cherchez une commune</b><span>Tous ses EHPAD sur une page, classés et comparables.</span></div></li>
    <li class="card"><div class="vis" aria-hidden="true"><div class="v-sum"><div><small>Prix par mois</small><b>${cnt(2203, "eur")}</b></div><div class="r">${ring(8.8)}</div></div></div><div class="txt"><b>Lisez le résumé</b><span>Le prix par mois, une note sur 10 et les avis des familles. Le détail s'ouvre à la demande.</span></div></li>
    <li class="card"><div class="vis" aria-hidden="true"><div class="v-cmp"><div><i class="ck">✓</i><b>2 203 €</b><small>note 8,8</small></div><div><i class="ck">✓</i><b>2 400 €</b><small>note 10,0</small></div></div></div><div class="txt"><b>Comparez</b><span>Cochez 2 ou 3 établissements pour les voir côte à côte.</span></div></li>
  </ol>
</div></section>
<section class="block"><div class="wrap">
  <h2>Les grandes villes</h2>
  <p class="sect-sub">Prix médian d'une chambre seule, comparé à celui de la France entière : ${eur(nat.med)} par mois.</p>
  <ul class="cities">${cities.map((c) => {
    const g = c.med ? c.med - nat.med : null, k = g === null ? "" : g > 50 ? "up" : g < -50 ? "dn" : "eq";
    const tag = g === null ? "" : `<em class="vs ${k}">${k === "up" ? `${eur(g)} de plus qu'en France` : k === "dn" ? `${eur(-g)} de moins qu'en France` : "Comme en France"}</em>`;
    return `<li><a href="${communeUrl(c)}"><span class="ct"><b>${esc(c.nom)}</b><small>${c.dep}</small></span><span class="cp num">${c.med ? eur(c.med) : "–"}<small>par mois</small></span>${tag}<span class="cn">${c.n} EHPAD</span></a></li>`;
  }).join("")}</ul>
  <div class="dep-h"><h2>Par département</h2><label class="dep-f">${ICON.search}<input type="search" placeholder="Nom ou numéro" aria-label="Filtrer les départements" data-depfilter autocomplete="off"></label></div>
  <p class="sect-sub">Prix médian par mois. Cliquez pour voir les EHPAD du département, commune par commune.</p>
  <div class="regions">${regions.map(([r, ds]) => `<details class="reg" open><summary>${esc(r)}<span>${ds.length}</span></summary><ul>${ds.map((d) => `<li data-q="${esc(d.code + " " + d.nom)}"><a href="${depUrl(d)}"><i>${d.code}</i><span>${esc(d.nom)}</span><em class="num">${d.med ? eur(d.med) : "–"}</em></a></li>`).join("")}</ul></details>`).join("")}</div>
  <p class="dep-none" hidden>Aucun département ne correspond.</p>
</div></section>`;
}

export function renderCommune({ c, es, dep, kids = [] }) {
  const place = inCity(c);
  const k = es.filter((e) => e.has).length, np = es.filter((e) => e.mois).length;
  const tiles = tiles3([
    `<div class="tile p"><span class="lab">Prix médian par mois</span>${c.med ? `<span class="val">${cnt(c.med, "eur")}</span><span class="sub">${np > 1 ? `De ${eur(c.min)} à ${eur(c.max)} selon l'établissement.` : "Un seul prix déclaré."} ${esc(dep.nom)} : ${eur(dep.med)}.</span>` : '<span class="val sm">Non déclaré</span><span class="sub">Aucun prix publié pour ces établissements.</span>'}</div>`,
    `<div class="tile"><span class="lab">${plural(c.n, "Établissement")}</span><span class="val">${cnt(c.n, "int")}</span><span class="sub">${np} ${plural(np, "prix déclaré")}, ${k} ${plural(k, "évalué")}</span></div>`,
    `<div class="tile"><span class="lab">Note médiane</span>${c.nmed != null ? `<span class="val">${cnt(c.nmed, "n1")} <small>sur 10</small></span><span class="sub">d'après les évaluations de la HAS</span>` : '<span class="val sm">–</span><span class="sub">Pas encore d\'évaluation publiée</span>'}</div>`,
  ]);
  const kidsHtml = kids.length ? `<section class="block"><div class="wrap"><h2>Par arrondissement</h2><ul class="links">${kids.map((x) => `<li><a href="${communeUrl(x)}">${esc(x.nom)}</a><span>${x.n} ${plural(x.n, "EHPAD", "EHPAD")}${x.med ? " · " + eur(x.med) : ""}</span></li>`).join("")}</ul></div></section>` : "";
  return `<section class="band on-band"><div class="wrap">
  <p class="crumb"><a href="/">Accueil</a><span>›</span><a href="${depUrl(dep)}">${esc(dep.nom)}</a>${c.parentRef ? `<span>›</span><a href="${communeUrl(c.parentRef)}">${esc(c.parentRef.nom)}</a>` : ""}</p>
  <h1>EHPAD ${place}&nbsp;: prix, avis et classement ${new Date().getFullYear()}</h1>
  ${tiles}
  ${priceChart(es, { place })}
</div></section>
${kidsHtml}
<section class="block"><div class="wrap">
  ${rankedList(es)}
  <div id="tray"></div>
  ${k ? noteHelp : ""}
  ${c.n === 1 ? `<p class="more"><a href="${depUrl(dep)}">Voir tous les EHPAD ${inDep(dep)}</a></p>` : ""}
</div></section>`;
}

export function renderDep({ d, es, communes, nat }) {
  const place = inDep(d);
  const k = es.filter((e) => e.has).length;
  const tiles = tiles3([
    `<div class="tile p"><span class="lab">Prix médian par mois</span>${d.med ? `<span class="val">${cnt(d.med, "eur")}</span><span class="sub">France : ${eur(nat.med)}.</span>` : '<span class="val sm">Non déclaré</span>'}</div>`,
    `<div class="tile"><span class="lab">Établissements</span><span class="val">${cnt(d.n, "int")}</span><span class="sub">${d.np} prix déclarés, ${k} évalués</span></div>`,
    `<div class="tile"><span class="lab">Note médiane</span>${d.nmed != null ? `<span class="val">${cnt(d.nmed, "n1")} <small>sur 10</small></span><span class="sub">d'après les évaluations de la HAS</span>` : '<span class="val sm">–</span>'}</div>`,
  ]);
  return `<section class="band on-band"><div class="wrap">
  <p class="crumb"><a href="/">Accueil</a></p>
  <h1>EHPAD ${place}&nbsp;: prix, avis et classement ${new Date().getFullYear()}</h1>
  ${tiles}
  ${priceChart(es, { place })}
</div></section>
<section class="block"><div class="wrap">
  <h2>Par commune</h2>
  <ul class="links">${communes.map((c) => `<li><a href="${communeUrl(c)}">${esc(c.nom)}</a><span>${c.n} EHPAD${c.med ? " · " + eur(c.med) : ""}</span></li>`).join("")}</ul>
</div></section>
<section class="block"><div class="wrap">
  <h2>Le classement ${place}</h2>
  ${rankedList(es)}
  <div id="tray"></div>
  ${k ? noteHelp : ""}
</div></section>`;
}

export function renderFiche({ e, c, dep, peers, gUrl }) {
  const h = e.has, nt = h ? h.note : null;
  // rang : dans la commune s'il y a au moins 2 établissements évalués, sinon dans le département
  const useC = e.rc && e.rc[1] >= 2;
  const rk = useC ? e.rc : e.rd, rkPlace = useC ? inCity(c) : inDep(dep);
  const pp = e.prc && e.prc[1] >= 3 ? [e.prc, inCity(c)] : e.prd ? [e.prd, inDep(dep)] : null;
  const pw = !e.mois || !pp ? "prix non comparé" : pp[0][0] <= pp[0][1] / 3 ? `prix parmi les plus bas ${pp[1]}` : pp[0][0] > (pp[0][1] * 2) / 3 ? `prix parmi les plus élevés ${pp[1]}` : `prix dans la moyenne ${pp[1]}`;
  const qw = !h ? "qualité pas encore évaluée" : rk[0] <= Math.ceil(rk[1] / 3) ? "qualité parmi les mieux notées" : rk[0] > rk[1] - Math.floor(rk[1] / 3) ? "qualité parmi les moins bien notées" : "qualité dans la moyenne";
  const medRef = c.n >= 3 && c.med ? [c.med, inCity(c)] : [dep.med, inDep(dep)];
  const diff = e.mois && medRef[0] ? e.mois - medRef[0] : null;
  const an = e.maj ? e.maj.slice(0, 4) : "";
  const year = new Date().getFullYear();
  const acc = (t, hint, body, id) => `<details class="card" id="${id}"><summary><b>${t}</b><span>${hint}</span></summary><div class="in">${body}</div></details>`;

  const prix = e.mois ? `
    <div class="split" aria-hidden="true"><i style="flex:${e.cs}"></i><i style="flex:${e.g56}"></i></div>
    <div class="split-leg num"><div><b>${eur2(e.cs)}</b>d'hébergement par jour, en chambre seule</div><div style="text-align:right"><b>${eur2(e.g56)}</b>de dépendance par jour (tarif GIR 5-6)</div></div>
    <dl class="kv num" style="margin-top:12px">
      <div class="tot"><dt>Total sur 30 jours</dt><dd>${eur(e.mois)}</dd></div>
      ${e.cd ? `<div><dt>Hébergement en chambre double</dt><dd>${eur2(e.cd)} par jour</dd></div>` : ""}
      ${e.csa ? `<div><dt>Hébergement pour un bénéficiaire de l'aide sociale</dt><dd>${eur2(e.csa)} par jour</dd></div>` : ""}
    </dl>
    ${e.inclus ? `<p class="src"><b>Compris dans le prix, selon l'établissement :</b> ${esc(e.inclus)}</p>` : ""}
    ${e.autre ? `<p class="src"><b>Précision de l'établissement :</b> ${esc(e.autre)}</p>` : ""}
    <p class="note" style="margin-top:14px"><b>Tarif ${an}</b>, déclaré le ${dateFr(e.maj)}. ${Number(an) < year ? `Le tarif ${year} n'est pas encore dans les données publiques : demandez-le à l'établissement.` : "C'est le dernier tarif publié."}</p>`
    : e.cs ? `<p class="tx">Hébergement en chambre seule : <b>${eur2(e.cs)} par jour</b>. Le tarif dépendance n'est pas publié : demandez-le à l'établissement.</p>`
      : `<p class="tx">Cet établissement n'a pas déclaré ses prix dans les données publiques de la CNSA. Demandez-les directement par téléphone ou sur place.</p>`;

  const quality = h ? `
    <p class="src" style="margin-top:4px"><b>Le niveau officiel</b></p>
    <p class="tx" style="margin-top:4px">La Haute Autorité de santé (HAS) classe chaque EHPAD évalué sur 4 niveaux, de A (le meilleur) à D. Celui-ci est au <b>niveau ${h.n}</b>, ${LEVEL_TXT[h.n]}.</p>
    <div class="scale" role="img" aria-label="Niveau ${h.n} sur une échelle de A, le meilleur, à D">${[..."ABCD"].map((l) => `<span class="${l === h.n ? "on" : ""}">${l}</span>`).join("")}</div>
    <p class="src" style="margin-top:18px"><b>Notre note sur 10</b></p>
    <p class="tx" style="margin-top:4px">Pour départager les établissements d'un même niveau, nous calculons une note de <b>${n1(nt)} sur 10</b>. Les 9 thèmes comptent pour 70 %, les exigences essentielles pour 30 %.</p>
    <dl class="kv" style="margin-top:10px"><div><dt>9 thèmes évalués, en moyenne (70 %)</dt><dd class="num">${n1((h.th.reduce((a, b) => a + b, 0) / 9) * 2.5)} sur 10</dd></div><div><dt>${h.nci} exigences essentielles, dont ${h.ci} respectées (30 %)</dt><dd class="num">${n1((h.ci / h.nci) * 10)} sur 10</dd></div><div class="tot"><dt>Note de l'établissement</dt><dd class="num">${n1(nt)} sur 10</dd></div></dl>
    <p class="src" style="margin-top:14px"><b>Le détail des 9 thèmes, notés sur 10</b></p>
    <div class="bars" style="margin-top:8px">${h.th.map((v, i) => `<div class="bar${v < 3 ? " low" : ""}"><span>${THEMES[i]}</span><em class="num">${n1(v * 2.5)}</em><i><u style="width:${(v / 4) * 100}%"></u></i></div>`).join("")}</div>
    <p class="src">Évaluation du ${dateFr(h.d)}${h.ev ? " par " + esc(h.ev) : ""}. La HAS note chaque thème de 1 à 4 ; nous convertissons sur 10.${h.multi ? " Cette évaluation a porté sur plusieurs établissements à la fois." : ""}</p>
    <p class="tx">Tous les 5 ans, un organisme indépendant évalue l'établissement selon le référentiel de la HAS. La HAS précise que ce premier cycle se prête mal aux comparaisons : demandez à l'établissement ce qu'il a amélioré depuis.</p>
    <p class="tx"><a href="https://www.has-sante.fr/fiche-essms/${e.id}" target="_blank" rel="noopener">Voir la fiche officielle sur le site de la HAS</a></p>`
    : `<p class="tx">Chaque EHPAD est évalué tous les 5 ans. Le premier cycle national se termine en 2027 : cet établissement n'a peut-être pas encore été évalué. Cela ne dit rien de sa qualité.</p>
    <p class="tx"><a href="https://www.has-sante.fr/fiche-essms/${e.id}" target="_blank" rel="noopener">Vérifier sur le site de la HAS</a></p>`;

  const aid = `<ul class="aids" style="margin-top:6px">
      <li><a href="/aides/apa-en-ehpad/"><b>APA en établissement</b></a> (GIR 1 à 4) : elle paie une partie du tarif dépendance au-delà du tarif GIR 5-6, déjà compté ici, selon vos revenus.</li>
      <li><a href="/aides/aide-au-logement-ehpad/"><b>Aide au logement</b></a> (APL ou ALS), selon les revenus.</li>
      <li><a href="/aides/aide-sociale-hebergement-ash/"><b>Aide sociale à l'hébergement</b></a> : ${e.ash ? "cet établissement est habilité à recevoir des bénéficiaires." : "cet établissement n'est pas habilité, d'après l'annuaire FINESS."}</li>
      <li><a href="/aides/reduction-impot-ehpad/"><b>Réduction d'impôt</b></a> de 25 % des frais, jusqu'à 2 500 € par an, pour les résidents imposables.</li>
    </ul><p class="tx"><a href="/aides/">Toutes les aides en détail</a></p>`;

  return `<section class="band on-band"><div class="wrap">
  <p class="crumb"><a href="/">Accueil</a><span>›</span><a href="${depUrl(dep)}">${esc(dep.nom)}</a><span>›</span><a href="${communeUrl(c)}">EHPAD ${inCity(c)}</a></p>
  <h1 class="fiche-h1">${esc(e.nom)}</h1>
  ${tiles3([
    `<div class="tile p"><span class="lab">Prix par mois</span>${e.mois ? `<span class="val">${cnt(e.mois, "eur")}</span><span class="sub">${diff == null ? "" : Math.abs(diff) < 25 ? `Au niveau de la médiane ${medRef[1]}.` : `<b>${eur(Math.abs(diff))} ${diff < 0 ? "de moins" : "de plus"}</b> que la médiane ${medRef[1]}.`} Chambre seule, avant les aides.</span>` : '<span class="val sm">Non déclaré</span><span class="sub">Demandez-le à l\'établissement.</span>'}</div>`,
    `<div class="tile q">${ring(nt)}<div><span class="lab">Note sur 10</span><span class="sub">${h ? `<b>${ord(rk[0])} sur ${rk[1]}</b> ${rkPlace}<br>Niveau officiel HAS&nbsp;:&nbsp;${h.n}` : "Pas encore évalué par la HAS"}</span></div></div>`,
    `<div class="tile"><span class="lab">Avis des familles</span><span class="sub">Publiés sur Google par les proches des résidents.</span><a class="btn" style="margin-top:auto;align-self:flex-start" href="${gUrl}" target="_blank" rel="noopener">Lire les avis</a></div>`,
  ])}
  <p class="verdict"><b>En résumé :</b> ${pw}, ${qw}, aide sociale ${e.ash ? "acceptée" : "non acceptée"}.</p>
  ${e.mois ? priceChart(peers, { cur: e.id, place: peers.place }) : ""}
</div></section>
<section class="block"><div class="wrap">
  <div class="card cbar">
    <div class="who">${e.tel ? `<p class="contact num">${e.tel}</p>` : '<p style="color:var(--muted)">Téléphone non renseigné dans l\'annuaire.</p>'}<p style="color:var(--muted);font-size:.93rem">${esc(e.adr ? e.adr + ", " : "")}${e.cp} ${esc(e.ville)}${h && h.st ? " · " + esc(h.st) : ""}</p></div>
    <button type="button" class="btn" data-add="${e.id}">Ajouter à la comparaison</button>
    <a class="btn ghost" href="/a-propos/#erreur">Signaler une erreur</a>
  </div>
  <div class="acc">
    ${acc("Le détail du prix", e.mois ? `${eur2(e.cs + e.g56)} par jour · tarif ${an}` : "non déclaré", prix, "prix")}
    ${acc("La qualité en détail", h ? `niveau officiel ${h.n} · note ${n1(nt)} sur 10` : "pas encore de résultat", quality, "qualite")}
    ${acc("Les avis des familles", "sur Google", `<p class="tx">EHPAD Arena ne recueille pas d'avis. Ceux des familles sont publiés sur Google ; ils ne comptent pas dans notre note.</p><p class="tx"><a href="${gUrl}" target="_blank" rel="noopener">Lire les avis sur Google</a></p>`, "avis")}
    ${acc("Les aides possibles", "APA, logement, aide sociale, impôt", aid, "aides")}
  </div>
  <div id="tray"></div>
</div></section>`;
}

export function renderCompare() {
  return `<section class="band"><div class="wrap"><h1>Votre comparaison</h1><p class="lede">Jusqu'à 3 établissements côte à côte.</p></div></section>
<section class="block"><div class="wrap"><div id="cmp"><p class="tx">Chargement…</p></div></div></section>`;
}

// Prix médian selon le niveau officiel : en tout, puis à statut égal.
export function qualityPrice(qp) {
  const L = Object.keys(qp.all), top = Math.max(...L.map((l) => qp.all[l][1]));
  const gap = qp.all.A && qp.all.B ? qp.all.A[1] - qp.all.B[1] : 0;
  const ST = [["Public", "Public"], ["Privé à but non lucratif", "Privé non lucratif"], ["Privé commercial", "Privé commercial"]];
  const span = (g) => { const v = Object.values(g).map((x) => x[1]); return v.length > 1 ? Math.max(...v) - Math.min(...v) : 0; };
  const ab = ST.map(([k]) => qp.st[k]?.A && qp.st[k]?.B ? qp.st[k].A[1] - qp.st[k].B[1] : null).filter((x) => x !== null);
  const maxIn = ab.length ? Math.max(...ab) : gap;
  const comA = qp.st["Privé commercial"]?.A, comC = qp.st["Privé commercial"]?.C;
  const shareA = comA ? Math.round((comA[0] / qp.all.A[0]) * 100) : 0, shareC = comC && qp.all.C ? Math.round((comC[0] / qp.all.C[0]) * 100) : 0;
  const pub = qp.st.Public || {}, pubSpan = span(pub);
  const head = gap > 0 ? `Les EHPAD de niveau A coûtent ${cnt(gap, "eur")} de plus par mois que ceux de niveau B` : `Les EHPAD de niveau A ne coûtent pas plus cher que ceux de niveau B`;
  const levelsHead = ["A", "B", "C", "D"].map((l) => `<th scope="col"><span class="lb lv-${l}">${l}</span></th>`).join("");
  return `<div class="card pad wide"><p class="k">Prix et qualité</p><h3>${head}</h3>
      <div class="hbs num qp">${L.map((l) => `<div class="hb q-${l}"><span>Niveau ${l} <small>${int(qp.all[l][0])} EHPAD</small></span><u style="width:${((qp.all[l][1] / top) * 100).toFixed(1)}%"></u><b>${eur(qp.all[l][1])}</b></div>`).join("")}</div>
      ${maxIn < gap ? `<p class="qp-why"><b>Mais à statut égal, l'écart entre A et B tombe à ${eur(Math.max(0, maxIn))} au plus.</b> Les EHPAD privés commerciaux sont à la fois les plus chers et les mieux évalués : ils font ${shareA} % des EHPAD de niveau A, contre ${shareC} % de ceux de niveau C.${pubSpan < 100 ? ` Dans le public, le prix est presque le même quel que soit le niveau.` : ""}</p>` : ""}
      <p class="qcap">Prix médian par mois en euros, selon le statut et le niveau officiel</p><div class="qtab-w"><table class="qtab num"><thead><tr><th scope="col">Statut</th>${levelsHead}</tr></thead><tbody>${ST.map(([k, lab]) => `<tr><th scope="row">${lab}</th>${["A", "B", "C", "D"].map((l) => `<td>${qp.st[k]?.[l] ? int(qp.st[k][l][1]) : "–"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <p class="src">${int(qp.n)} EHPAD ayant à la fois un prix publié et un niveau officiel. « – » : moins de 20 établissements, pas de médiane affichée. Un prix plus élevé ne garantit donc pas une meilleure qualité : comparez les EHPAD d'un même statut.</p></div>`;
}

export function renderAbout({ contact, nat, meta, cs, g56 }) {
  const DG = "https://www.data.gouv.fr/fr/datasets/";
  const SRC = [
    ["Les prix", "CNSA", "Caisse nationale de solidarité pour l'autonomie", "Le prix d'hébergement et les tarifs dépendance déclarés par chaque EHPAD.", `Mise à jour du ${dateFr(meta.cnsaUpdated)}`, DG + "prix-hebergement-et-tarifs-dependance-des-ehpad-donnees-brutes/"],
    ["La qualité", "HAS", "Haute Autorité de santé", "Le résultat de l'évaluation : niveau officiel, 9 thèmes notés, exigences essentielles.", `Mise à jour du ${dateFr(meta.hasUpdated)}`, DG + "resultats-devaluation-des-etablissements-et-services-sociaux-et-medico-sociaux-essms/"],
    ["L'annuaire", "FINESS", "Ministère de la Santé", "Le nom, l'adresse, le téléphone, le statut et la position de chaque établissement.", esc(meta.finess), DG + "finess-extraction-du-fichier-des-etablissements/"],
  ];
  const ENG = [
    ["Gratuit", "Toutes les pages, pour tout le monde."],
    ["Sans inscription", "Aucun compte, aucune adresse e-mail demandée."],
    ["Indépendant", "Aucun établissement ne peut payer pour être mis en avant ou pour modifier sa fiche."],
    ["Sans cookie", "Aucun cookie tant que la publicité est éteinte."],
  ];
  const TOC = [["pourquoi", "Pourquoi ce site"], ["sources", "D'où viennent les chiffres"], ["prix", "Le prix par mois"], ["qualite", "Le niveau officiel et la note"], ["avis", "Les avis des familles"], ["engagements", "Nos engagements"], ["erreur", "Signaler une erreur"]];
  return `<section class="band"><div class="wrap"><h1>À propos d'EHPAD Arena</h1><p class="lede">Pourquoi ce site et d'où viennent les chiffres.</p>
  <div class="ab-stats num"><div><b>${cnt(nat.n, "int")}</b><span>EHPAD en France</span></div><div><b>${cnt(nat.np, "int")}</b><span>avec un prix publié</span></div><div><b>${cnt(nat.nh, "int")}</b><span>évalués par la HAS</span></div><div><b>3</b><span>sources officielles</span></div></div></div></section>
<section class="block"><div class="wrap doc">
  <aside class="doc-side"><nav class="toc" aria-label="Sur cette page"><b>Sur cette page</b>${TOC.map((t) => `<a href="#${t[0]}">${t[1]}</a>`).join("")}</nav></aside>
  <article class="doc-main">
    <section id="pourquoi"><h2>Pourquoi ce site</h2>
      <p class="doc-lead">Choisir un EHPAD se fait souvent dans l'urgence, après une chute ou une hospitalisation. Les informations utiles sont publiques, mais dispersées sur plusieurs sites.</p>
      <p>EHPAD Arena les réunit sur une seule page par établissement, avec un résumé lisible en quelques secondes : le prix par mois, le niveau de qualité officiel et un accès aux avis des familles. Le site fait partie de la famille Job Arena, Scol Arena et Eau Arena.</p></section>
    <section id="sources"><h2>D'où viennent les chiffres</h2>
      <p>Trois sources officielles, toutes publiques.</p>
      <ul class="srcs">${SRC.map((x) => `<li><span class="s-k">${x[0]}</span><div><b>${x[1]}</b> <small>${x[2]}</small><p>${x[3]}</p><p class="s-d">${x[4]} · <a href="${x[5]}" target="_blank" rel="noopener">voir les données sur data.gouv.fr ↗</a></p></div></li>`).join("")}</ul>
      <p class="src">Données publiques réutilisées sous Licence Ouverte. Le site est recalculé chaque semaine ; dernier calcul le ${dateFr(meta.built)}.</p></section>
    <section id="prix"><h2>Le prix par mois</h2>
      <p>Nous additionnons le prix d'hébergement et le tarif dépendance minimum, pour 30 jours, dans une chambre seule.</p>
      <div class="ab-eq num"><div><b>${eur2(cs)}</b><span>hébergement par jour</span></div><i>+</i><div><b>${eur2(g56)}</b><span>dépendance par jour (GIR 5-6)</span></div><i>× 30</i><div class="r"><b>${eur(Math.round((cs + g56) * 30))}</b><span>par mois</span></div></div>
      <p class="src" style="margin-top:0">Exemple avec les valeurs médianes en France.</p>
      <ul><li>C'est le prix avant les <a href="/aides/">aides</a>, qui réduisent ensuite la facture.</li><li>Le tarif dépendance GIR 5-6 est le minimum payé par chaque résident.</li><li>Nous affichons le dernier tarif déclaré par l'établissement : un tarif plus récent peut s'appliquer.</li></ul></section>
    <section id="qualite"><h2>Le niveau officiel et la note</h2>
      <p>Chaque EHPAD est évalué par un organisme indépendant, selon le référentiel de la Haute Autorité de santé. Nous affichons deux choses.</p>
      <div class="two">
        <div><h3>Le niveau officiel</h3><p class="ab-lv">${[..."ABCD"].map((l) => `<i class="lb lv-${l}">${l}</i>`).join("")}</p><p>Attribué par la HAS, de A (le meilleur) à D. Nous l'affichons tel quel.</p></div>
        <div><h3>Notre note sur 10</h3><div class="ab-split"><div style="flex:7"><b>70 %</b><span>les 9 thèmes notés</span></div><div style="flex:3"><b>30 %</b><span>exigences essentielles</span></div></div><p>Calculée sur la même évaluation, elle sert à départager les EHPAD d'un même niveau.</p></div>
      </div>
      <p class="ab-order"><span>Ordre du classement</span><b>1. Niveau officiel</b><b>2. Note</b><b>3. Prix</b></p>
      <p class="note">La HAS évalue surtout l'organisation et la démarche qualité. Elle précise que ce premier cycle d'évaluations se prête mal aux comparaisons. Seuls les EHPAD dont l'évaluation est publiée sont classés.</p></section>
    <section id="avis"><h2>Les avis des familles</h2>
      <p>Ce sont ceux publiés sur Google : chaque fiche y renvoie. EHPAD Arena n'en recueille aucun, et ils ne comptent pas dans la note.</p></section>
    <section id="engagements"><h2>Nos engagements</h2>
      <ul class="checks">${ENG.map((x) => `<li><b>${x[0]}</b><span>${x[1]}</span></li>`).join("")}</ul></section>
    <section id="erreur"><h2>Signaler une erreur</h2>
      <p>Écrivez-nous en précisant l'établissement. Nous comparons avec la source officielle et corrigeons sous quelques jours. Si l'erreur vient de la source, nous vous indiquons à qui vous adresser.</p>
      <p style="margin-top:14px"><a class="btn" href="mailto:${esc(contact)}?subject=${encodeURIComponent("Erreur sur une fiche EHPAD Arena")}">Écrire à ${esc(contact)}</a></p></section>
  </article>
</div></section>`;
}

// ---------- titres et descriptions ----------
export function seo(kind, a = {}) {
  const y = new Date().getFullYear();
  if (kind === "home") return { title: "EHPAD Arena : combien coûte un EHPAD près de chez vous ?", desc: "Prix par mois, évaluation officielle de la HAS et avis des familles pour chaque EHPAD de France. Gratuit, sans inscription." };
  if (kind === "commune") return { title: `EHPAD ${inCity(a.c)} : prix, avis et classement ${y}`, desc: `Les ${a.c.n} ${plural(a.c.n, "EHPAD")} ${inCity(a.c)}${a.c.med ? `, de ${eur(a.c.min)} à ${eur(a.c.max)} par mois` : ""} : prix déclarés, niveau officiel de la HAS, note sur 10 et avis.` };
  if (kind === "dep") return { title: `EHPAD ${inDep(a.d)} : prix, avis et classement ${y}`, desc: `Les ${a.d.n} EHPAD ${inDep(a.d)}${a.d.med ? `, prix médian ${eur(a.d.med)} par mois` : ""} : prix, niveau officiel de la HAS, note sur 10 et avis, commune par commune.` };
  if (kind === "fiche") {
    const e = a.e;
    return { title: `${e.nom} (${e.ville.replace(/ \d+(e|er) Arrondissement$/, "")}) : prix, avis, note`, desc: `${e.nom} à ${e.ville}${e.mois ? ` : ${eur(e.mois)} par mois` : ""}${e.has ? `, niveau officiel HAS ${e.has.n}, note ${n1(e.has.note)} sur 10` : ""}. Détail du prix, qualité, aides et avis des familles.` };
  }
  return { title: a.title, desc: a.desc };
}
