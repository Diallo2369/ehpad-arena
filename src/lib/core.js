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
export function renderHome({ nat, cities, deps }) {
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
  <ul class="links">${cities.map((c) => `<li><a href="${communeUrl(c)}">EHPAD ${inCity(c).replace(/^à /, "à ")}</a><span>${c.n} ${plural(c.n, "établissement")}</span></li>`).join("")}</ul>
  <h2 style="margin-top:30px">Par département</h2>
  <ul class="links deps">${deps.map((d) => `<li><a href="${depUrl(d)}">${esc(d.nom)}</a><span>${d.code}</span></li>`).join("")}</ul>
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
      <li><b>APA en établissement</b> (GIR 1 à 4) : elle paie une partie du tarif dépendance au-delà du tarif GIR 5-6, déjà compté ici, selon vos revenus.</li>
      <li><b>Aide au logement</b> (APL ou ALS), selon les revenus.</li>
      <li><b>Aide sociale à l'hébergement</b> : ${e.ash ? "cet établissement est habilité à recevoir des bénéficiaires." : "cet établissement n'est pas habilité, d'après l'annuaire FINESS."}</li>
      <li><b>Réduction d'impôt</b> de 25 % des frais, jusqu'à 2 500 € par an, pour les résidents imposables.</li>
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

export function renderAides() {
  const A = [
    ["APA en établissement", "Allocation personnalisée d'autonomie", "Elle paie une partie du tarif dépendance, pour les personnes de 60 ans ou plus évaluées en GIR 1 à 4 par le médecin de l'établissement. Son montant dépend des revenus. Avec moins de 2 846,77 € de revenus par mois (seuil 2026), vous ne payez que le tarif GIR 5-6, déjà compté dans nos prix par mois ; au-delà, une partie de la différence reste à votre charge.", "Auprès de la direction de l'établissement, qui indique les démarches. Elle est versée par le département."],
    ["Aide au logement", "APL ou ALS", "Elle réduit le prix de l'hébergement, selon vos revenus, si l'établissement est votre résidence principale. L'APL concerne les établissements conventionnés APL, l'ALS les autres ; elles ne se cumulent pas. L'APL est versée directement à l'établissement.", "Auprès de la CAF ou de la MSA."],
    ["Aide sociale à l'hébergement", "ASH", "Elle paie la différence entre la facture de l'établissement et ce que vous pouvez payer, quand vos ressources ne suffisent pas, dans les établissements habilités à l'aide sociale. Vos enfants (obligés alimentaires) peuvent être sollicités, et les sommes versées peuvent être récupérées de votre vivant ou sur la succession.", "Auprès du conseil départemental, souvent par l'intermédiaire de la mairie (CCAS)."],
    ["Réduction d'impôt", "25 % des frais, jusqu'à 2 500 € par an", "Les frais de dépendance et d'hébergement ouvrent droit à une réduction d'impôt de 25 %, dans la limite de 10 000 € de dépenses par an et par personne hébergée, soit 2 500 € au plus. Les aides reçues (APA, aide au logement, aide sociale) sont déduites. Elle ne profite qu'aux résidents imposables.", "Dans la déclaration de revenus."],
  ];
  return `<section class="band"><div class="wrap"><h1>Quelles aides pour payer un EHPAD ?</h1><p class="lede">Quatre aides réduisent la facture d'une maison de retraite médicalisée. Elles peuvent se cumuler.</p></div></section>
<section class="block"><div class="wrap">
  <div class="cols">${A.map((a) => `<div class="card pad"><h2>${a[0]}</h2><p class="src" style="margin:-6px 0 10px">${a[1]}</p><p>${a[2]}</p><p style="margin-top:10px"><b>Où la demander.</b> ${a[3]}</p></div>`).join("")}</div>
  <p class="note" style="margin-top:18px">Pour estimer votre reste à charge dans un EHPAD précis, après APA et aide au logement, utilisez le simulateur de l'annuaire officiel sur <a href="https://www.pour-les-personnes-agees.gouv.fr" target="_blank" rel="noopener">pour-les-personnes-agees.gouv.fr</a>. Dans 23 départements, un nouveau mode de financement est expérimenté depuis juillet 2025 : le tarif dépendance y est fondu dans un forfait global.</p>
  <p class="src" style="margin-top:12px">Sources : portail national pour-les-personnes-agees.gouv.fr (APA en établissement, mis à jour le 9 juin 2026 ; aides au logement et ASH, mis à jour le 20 novembre 2025) et economie.gouv.fr (réduction d'impôt).</p>
</div></section>`;
}

export function renderActus({ nat, news }) {
  const H = nat.hist, maxH = Math.max(...H.map((d) => d[1]));
  const lab = (x, i) => (i === 0 ? "< " + int(x + 250) : i === H.length - 1 ? int(x) + " +" : int(x));
  const top = Math.max(...nat.cher.map((d) => d[1]));
  const hb = (a, c) => a.map((d) => `<div class="hb ${c}"><span>${esc(d[0])}</span><u style="width:${((d[1] / top) * 100).toFixed(1)}%"></u><b>${eur(d[1])}</b></div>`).join("");
  const [na, ma, nn, mn] = nat.ash;
  const peak = H.map((d, i) => [d[1], i]).sort((a, b) => b[0] - a[0]).slice(0, 2).map((x) => x[1]);
  const share = Math.round(((H[peak[0]][1] + H[peak[1]][1]) / nat.np) * 100);
  return `<section class="band"><div class="wrap"><h1>Actualités et chiffres des EHPAD</h1><p class="lede">Les chiffres que nous calculons à partir des données publiques, et l'actualité officielle du secteur.</p></div></section>
<section class="block"><div class="wrap">
  <h2>En chiffres</h2>
  <div class="info">
    <div class="card pad wide"><p class="k">Les prix en France</p><h3>${share} % des EHPAD coûtent entre ${int(H[Math.min(...peak)][0])} € et ${int(H[Math.max(...peak)][0] + 250)} € par mois</h3>
      <div class="hist" role="img" aria-label="Répartition de ${int(nat.np)} EHPAD par tranche de prix mensuel de 250 euros">${H.map((d, i) => `<div class="hc${peak.includes(i) ? " hi" : ""}" style="--i:${i}"><b>${int(d[1])}</b><i style="height:${Math.round((d[1] / maxH) * 150)}px"></i><span>${lab(d[0], i)}</span></div>`).join("")}</div>
      <p class="src">Nombre d'EHPAD par tranche de 250 €. Prix par mois d'une chambre seule, avant les aides.</p></div>
    <div class="card pad"><p class="k">Selon le département</p><h3>Du simple au double entre ${esc(nat.moins[0][0])} et ${esc(nat.cher[0][0])}</h3>
      <p class="hbt">Les 5 départements les plus chers</p><div class="hbs num">${hb(nat.cher, "")}</div>
      <p class="hbt">Les 5 moins chers</p><div class="hbs num">${hb(nat.moins, "lo")}</div>
      <p class="src">Prix médian par mois. Départements d'au moins 10 EHPAD.</p></div>
    <div class="card pad"><p class="k">Aide sociale</p><h3>${cnt(mn - ma, "eur")} d'écart par mois selon l'habilitation</h3>
      <div class="duo num"><div><div class="v">${cnt(ma, "eur")}</div><span>prix médian des ${int(na)} EHPAD habilités à l'aide sociale</span><u style="width:${((ma / mn) * 100).toFixed(1)}%"></u></div>
      <div class="n"><div class="v">${cnt(mn, "eur")}</div><span>prix médian des ${int(nn)} EHPAD non habilités</span><u style="width:100%"></u></div></div>
      <p class="src">Au total, ${int(nat.nash)} EHPAD sur ${int(nat.n)} sont habilités à l'aide sociale.</p></div>
    <div class="card pad wide"><p class="k">Qualité</p><h3>${int(nat.nh)} EHPAD évalués par la HAS, sur ${int(nat.n)}</h3>
      <div class="lvl">${[..."ABCD"].map((l) => `<div class="lv-${l}" style="flex:${nat.levels[l]}"><b>${l}</b><span>${int(nat.levels[l])}</span></div>`).join("")}</div>
      <p class="src">Nombre d'EHPAD par niveau officiel, de A (le meilleur) à D. Les autres n'ont pas encore de résultat publié.</p></div>
  </div>
  <p class="src">Calculs EHPAD Arena d'après les prix déclarés à la CNSA, les évaluations de la HAS et l'annuaire FINESS.</p>
</div></section>
<section class="block"><div class="wrap">
  <h2>Actualités</h2>
  <div class="news">${news.map((a) => `<article class="card"><time datetime="${a.date}">${dateFr(a.date)}</time><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p><a href="${a.url}" target="_blank" rel="noopener">Source : ${esc(a.source)}</a></article>`).join("")}</div>
</div></section>`;
}

export function renderAbout({ contact }) {
  return `<section class="band"><div class="wrap"><h1>À propos d'EHPAD Arena</h1><p class="lede">Pourquoi ce site et d'où viennent les chiffres.</p></div></section>
<section class="block"><div class="wrap"><div class="prose">
  <h2>Pourquoi ce site</h2>
  <p>Choisir un EHPAD se fait souvent dans l'urgence, après une chute ou une hospitalisation. Les informations utiles existent et sont publiques, mais elles sont dispersées : les prix sur un site, l'évaluation de la qualité sur un autre, les avis des familles ailleurs.</p>
  <p>EHPAD Arena les réunit sur une seule page par établissement, avec un résumé lisible en quelques secondes : le prix par mois, une note de qualité et les avis. Le site est gratuit et indépendant des établissements. Il fait partie de la famille Job Arena, Scol Arena et Eau Arena.</p>
  <h2>Les sources</h2>
  <ul>
    <li><b>Prix</b> : « Prix hébergement et tarifs dépendance des EHPAD », Caisse nationale de solidarité pour l'autonomie (CNSA), sur data.gouv.fr. Ce sont les prix déclarés par les établissements.</li>
    <li><b>Qualité</b> : « Résultats d'évaluation des établissements et services sociaux et médico-sociaux », Haute Autorité de santé (HAS), Licence Ouverte 2.0.</li>
    <li><b>Nom, adresse, téléphone</b> : répertoire FINESS du ministère de la Santé, sur data.gouv.fr.</li>
  </ul>
  <h2>Le prix par mois</h2>
  <p>Prix d'hébergement d'une chambre seule, plus le tarif dépendance GIR 5-6 qui reste à la charge de tout résident, multipliés par 30 jours. Le montant est affiché avant les aides. Il s'agit du dernier tarif déclaré : un tarif plus récent peut s'appliquer.</p>
  <h2>Le niveau officiel et notre note sur 10</h2>
  <p>La HAS classe chaque établissement évalué sur 4 niveaux, de A (le meilleur) à D. Nous affichons ce niveau tel quel, avec la date de l'évaluation.</p>
  <p>Pour départager les établissements d'un même niveau, nous calculons une note sur 10 à partir de la même évaluation : les 9 thèmes notés comptent pour 70 %, les exigences essentielles respectées pour 30 %. Le classement respecte toujours le niveau officiel : les établissements sont classés par niveau (A, puis B, puis C, puis D), puis par note. Il ne compte que les établissements dont l'évaluation est publiée. La HAS évalue surtout l'organisation et la démarche qualité ; elle précise que ce premier cycle se prête mal aux comparaisons.</p>
  <h2>Les avis des familles</h2>
  <p>EHPAD Arena ne recueille aucun avis. Ceux des familles sont publiés sur Google et ne comptent pas dans notre note.</p>
  <h2>Nos engagements</h2>
  <ul><li>Aucune inscription, aucun cookie tant que la publicité est éteinte.</li><li>Aucun établissement ne peut payer pour être mis en avant ou pour modifier sa fiche.</li></ul>
  <h2 id="erreur">Une erreur ?</h2>
  <p>Écrivez à <b class="sel">${esc(contact)}</b> en précisant l'établissement. Nous comparons avec la source officielle et corrigeons sous quelques jours. Si l'erreur vient de la source (prix déclaré, évaluation), nous vous indiquons à qui vous adresser.</p>
</div></div></section>`;
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
