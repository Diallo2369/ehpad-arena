// Actualités : une page d'accueil (aperçus) et une page dédiée par analyse et par actualité.
// Les analyses sont recalculées à chaque construction à partir des données (site.json).
import { esc, eur, int, cnt, dateFr, qualityPrice, inDep } from "./core.js";

const FIRST = "2026-11-12"; // première publication des analyses
const DG = "https://www.data.gouv.fr/fr/datasets/";
const SRC = {
  cnsa: [`prix déclarés à la CNSA`, DG + "prix-hebergement-et-tarifs-dependance-des-ehpad-donnees-brutes/"],
  has: [`évaluations de la HAS`, DG + "resultats-devaluation-des-etablissements-et-services-sociaux-et-medico-sociaux-essms/"],
  finess: [`annuaire FINESS`, DG + "finess-extraction-du-fichier-des-etablissements/"],
};
const srcLine = (keys) => `Calculs EHPAD Arena d'après les données publiques : ${keys.map((k) => `<a href="${SRC[k][1]}" target="_blank" rel="noopener">${SRC[k][0]}</a>`).join(", ").replace(/, ([^,]*)$/, " et $1")}. <a href="/a-propos/">Notre méthode</a>.`;
const pct = (a, b) => Math.round((a / b) * 100);
const host = (u) => new URL(u).hostname.replace(/^www\./, "");

// ---------- visuels ----------
function hist(nat, mini = false) {
  const H = nat.hist, maxH = Math.max(...H.map((d) => d[1]));
  const lab = (x, i) => (i === 0 ? "< " + int(x + 250) : i === H.length - 1 ? int(x) + " +" : int(x));
  const peak = peaks(nat);
  if (mini) return `<div class="mh" aria-hidden="true">${H.map((d, i) => `<i class="${peak.includes(i) ? "hi" : ""}" style="height:${Math.max(4, Math.round((d[1] / maxH) * 100))}%"></i>`).join("")}</div>`;
  return `<div class="hist" role="img" aria-label="Répartition de ${int(nat.np)} EHPAD par tranche de prix mensuel de 250 euros">${H.map((d, i) => `<div class="hc${peak.includes(i) ? " hi" : ""}" style="--i:${i};--h:${(d[1] / maxH).toFixed(3)}"><b>${int(d[1])}</b><i></i><span>${lab(d[0], i)} €</span></div>`).join("")}</div>`;
}
const peaks = (nat) => nat.hist.map((d, i) => [d[1], i]).sort((a, b) => b[0] - a[0]).slice(0, 2).map((x) => x[1]);
const bars = (rows, top, cls = "") => rows.map((d) => `<a class="hb ${cls}" href="/departement/${d[2]}/"><span>${esc(d[0])}</span><u style="width:${((d[1] / top) * 100).toFixed(1)}%"></u><b>${eur(d[1])}</b></a>`).join("");
function duo(nat) {
  const [na, ma, nn, mn] = nat.ash;
  return `<div class="duo num"><div><div class="v">${cnt(ma, "eur")}</div><span>prix médian des ${int(na)} EHPAD habilités à l'aide sociale</span><u style="width:${((ma / mn) * 100).toFixed(1)}%"></u></div>
    <div class="n"><div class="v">${cnt(mn, "eur")}</div><span>prix médian des ${int(nn)} EHPAD non habilités</span><u style="width:100%"></u></div></div>`;
}
const lvl = (nat) => `<div class="lvl">${[..."ABCD"].map((l) => `<div class="lv-${l}" style="flex:${nat.levels[l]}"><b>${l}</b><span>${int(nat.levels[l])}</span></div>`).join("")}</div>`;

// ---------- les analyses ----------
export function analyses({ nat, deps }) {
  const H = nat.hist, pk = peaks(nat);
  const share = Math.round(((H[pk[0]][1] + H[pk[1]][1]) / nat.np) * 100);
  const lo = int(H[Math.min(...pk)][0]), hi = int(H[Math.max(...pk)][0] + 250);
  const [na, ma, nn, mn] = nat.ash;
  const qp = nat.qp, gapAB = qp?.all.A && qp?.all.B ? qp.all.A[1] - qp.all.B[1] : 0;
  const ranked = Object.values(deps).filter((d) => d.med && d.np >= 10).sort((a, b) => b.med - a.med);
  const top = nat.cher[0][1];
  const bySlug = Object.fromEntries(Object.values(deps).map((d) => [d.slug, d]));
  const dHi = bySlug[nat.cher[0][2]], dLo = bySlug[nat.moins[0][2]];
  const ev = nat.nh, L = nat.levels;
  return [
    {
      slug: "prix-ehpad-france", k: "Les prix en France", src: ["cnsa", "finess"],
      title: "Combien coûte un EHPAD en France ?",
      head: `La moitié des EHPAD coûtent moins de ${eur(nat.med)} par mois, et ${share} % coûtent entre ${lo} € et ${hi} €.`,
      desc: `Prix médian d'un EHPAD en France : ${eur(nat.med)} par mois pour une chambre seule. Répartition des ${int(nat.np)} EHPAD par tranche de prix.`,
      fig: eur(nat.med), figl: "prix médian par mois", mini: hist(nat, true),
      body: () => `<div class="card pad"><p class="k">Nombre d'EHPAD par tranche de 250 € par mois</p>${hist(nat)}<p class="src">Prix par mois d'une chambre seule, avant les aides. ${int(nat.np)} EHPAD dont le prix est publié.</p></div>`,
      keys: [
        `Le prix médian est de <b>${eur(nat.med)} par mois</b> : la moitié des EHPAD coûtent moins, l'autre moitié plus.`,
        `<b>${share} %</b> des EHPAD coûtent entre ${lo} € et ${hi} € par mois.`,
        `1 EHPAD sur 10 coûte moins de <b>${eur(nat.d1)}</b>, et 1 sur 10 plus de <b>${eur(nat.d9)}</b>.`,
        `Ces prix comprennent l'hébergement et le tarif dépendance minimum (GIR 5-6). Les <a href="/aides/">aides</a> réduisent ensuite la facture.`,
      ],
      read: `Le prix par mois additionne le prix d'hébergement par jour et le tarif dépendance GIR 5-6 par jour, multipliés par 30, pour une chambre seule. C'est le dernier tarif déclaré par chaque établissement à la CNSA. Les soins médicaux, payés par l'Assurance maladie, n'y figurent pas.`,
      links: [["Prix des EHPAD par département", "/actualites/prix-ehpad-par-departement/"], ["Quelles aides pour payer un EHPAD ?", "/aides/"]],
    },
    {
      slug: "prix-ehpad-par-departement", k: "Selon le département", src: ["cnsa", "finess"],
      title: "Prix des EHPAD par département",
      head: `Du simple au double : ${eur(nat.moins[0][1])} par mois ${esc(inDep(dLo))}, ${eur(nat.cher[0][1])} ${esc(inDep(dHi))}.`,
      desc: `Prix médian d'un EHPAD dans chaque département, du moins cher (${nat.moins[0][0]}, ${eur(nat.moins[0][1])}) au plus cher (${nat.cher[0][0]}, ${eur(nat.cher[0][1])}). Classement des ${ranked.length} départements.`,
      fig: eur(nat.cher[0][1]), figl: `${inDep(dHi)}, contre ${eur(nat.moins[0][1])} ${inDep(dLo)}`,
      mini: `<div class="mb" aria-hidden="true">${[nat.cher[0], nat.cher[1], nat.moins[1], nat.moins[0]].map((d, i) => `<i class="${i > 1 ? "lo" : ""}" style="width:${((d[1] / top) * 100).toFixed(0)}%"></i>`).join("")}</div>`,
      body: () => `<div class="info"><div class="card pad"><p class="k">Les 5 plus chers</p><div class="hbs num">${bars(nat.cher, top)}</div></div><div class="card pad"><p class="k">Les 5 moins chers</p><div class="hbs num">${bars(nat.moins, top, "lo")}</div></div></div>
        <h2 class="mt">Tous les départements</h2>
        <div class="card dtab-w"><table class="dtab num"><thead><tr><th scope="col">Rang</th><th scope="col">Département</th><th scope="col">Prix médian</th><th scope="col">Écart avec la France</th><th scope="col">EHPAD</th></tr></thead><tbody>${ranked.map((d, i) => { const g = d.med - nat.med; return `<tr><td>${i + 1}</td><th scope="row"><a href="/departement/${d.slug}/">${esc(d.nom)}</a> <small>${d.code}</small></th><td><b>${eur(d.med)}</b></td><td class="${g > 50 ? "up" : g < -50 ? "dn" : ""}">${Math.abs(g) <= 50 ? "≈" : (g > 0 ? "+" : "−") + eur(Math.abs(g))}</td><td>${d.n}</td></tr>`; }).join("")}</tbody></table></div>
        <p class="src">Prix médian par mois d'une chambre seule, avant les aides. Départements d'au moins 10 EHPAD au prix publié ; « EHPAD » compte tous les établissements du département.</p>`,
      keys: [
        `Le département le plus cher est <b>${esc(nat.cher[0][0])}</b> (${eur(nat.cher[0][1])} par mois), le moins cher <b>${esc(nat.moins[0][0])}</b> (${eur(nat.moins[0][1])}).`,
        `Les 5 plus chers : ${nat.cher.map((d) => esc(d[0])).join(", ")}. Les 5 moins chers : ${nat.moins.map((d) => esc(d[0])).join(", ")}.`,
        `Dans un même département, l'écart entre EHPAD reste grand : comparez les établissements de votre commune.`,
      ],
      read: `Pour chaque département, nous prenons le prix médian des EHPAD dont le prix est publié : la moitié coûtent moins, la moitié plus. Les départements de moins de 10 prix publiés ne sont pas classés, l'écart y dépendrait trop d'un seul établissement.`,
      links: [["Combien coûte un EHPAD en France ?", "/actualites/prix-ehpad-france/"], ["Prix des EHPAD selon l'aide sociale", "/actualites/prix-ehpad-aide-sociale/"]],
    },
    {
      slug: "prix-ehpad-aide-sociale", k: "Aide sociale", src: ["cnsa", "finess"],
      title: "EHPAD habilités à l'aide sociale : moins chers ?",
      head: `Un EHPAD habilité à l'aide sociale coûte ${eur(mn - ma)} de moins par mois qu'un EHPAD non habilité (prix médians).`,
      desc: `Prix médian des EHPAD habilités à l'aide sociale (${eur(ma)}) et non habilités (${eur(mn)}) : ${eur(mn - ma)} d'écart par mois. ${int(nat.nash)} EHPAD sur ${int(nat.n)} sont habilités.`,
      fig: eur(mn - ma), figl: "de moins par mois dans un EHPAD habilité",
      mini: `<div class="mb" aria-hidden="true"><i style="width:${((ma / mn) * 100).toFixed(0)}%"></i><i class="lo" style="width:100%"></i></div>`,
      body: () => `<div class="card pad"><p class="k">Prix médian par mois selon l'habilitation</p>${duo(nat)}<p class="src">Au total, ${int(nat.nash)} EHPAD sur ${int(nat.n)} sont habilités à l'aide sociale, soit ${pct(nat.nash, nat.n)} %.</p></div>`,
      keys: [
        `Prix médian : <b>${eur(ma)}</b> par mois dans un EHPAD habilité, <b>${eur(mn)}</b> dans un EHPAD non habilité.`,
        `<b>${pct(nat.nash, nat.n)} %</b> des EHPAD sont habilités, en totalité ou en partie. Presque tous les EHPAD publics le sont.`,
        `Dans un EHPAD habilité, le prix d'hébergement des places habilitées est fixé chaque année par le département. Ailleurs, il est libre à l'entrée.`,
        `Seul un EHPAD habilité permet de demander l'<a href="/aides/#ash">aide sociale à l'hébergement</a> si vos revenus ne suffisent pas.`,
      ],
      read: `Nous comparons le prix médian des EHPAD habilités à l'aide sociale et celui des autres. L'habilitation peut être partielle : seules certaines places sont alors au tarif fixé par le département. Sur chaque fiche d'établissement, nous indiquons s'il est habilité.`,
      links: [["L'aide sociale à l'hébergement", "/aides/#ash"], ["Prix des EHPAD par département", "/actualites/prix-ehpad-par-departement/"]],
    },
    qp && {
      slug: "prix-et-qualite-ehpad", k: "Prix et qualité", src: ["cnsa", "has", "finess"],
      title: "Les EHPAD les plus chers sont-ils les mieux notés ?",
      head: gapAB > 0 ? `Les EHPAD de niveau A coûtent ${eur(gapAB)} de plus par mois que ceux de niveau B. Mais à statut égal, l'écart fond.` : `Le niveau officiel ne change presque rien au prix.`,
      desc: `Prix médian des EHPAD selon leur niveau officiel HAS (A, B, C, D), en tout et à statut égal (public, privé non lucratif, privé commercial). ${int(qp.n)} EHPAD analysés.`,
      fig: gapAB > 0 ? "+" + eur(gapAB) : "≈", figl: "par mois pour un EHPAD de niveau A plutôt que B",
      mini: `<div class="mq" aria-hidden="true">${Object.keys(qp.all).map((l) => `<i class="q-${l}" style="height:${((qp.all[l][1] / qp.all.A[1]) * 100 - 60) * 2.5}%"></i>`).join("")}</div>`,
      body: () => `<div class="info">${qualityPrice(qp)}</div>`,
      keys: [
        ...Object.keys(qp.all).map((l) => `Niveau ${l} : prix médian <b>${eur(qp.all[l][1])}</b> par mois (${int(qp.all[l][0])} EHPAD).`),
        `Les EHPAD privés commerciaux sont à la fois les plus chers et le plus souvent de niveau A : l'écart global vient surtout de là.`,
        `Un prix élevé ne garantit donc pas une meilleure qualité : comparez des EHPAD de même statut.`,
      ],
      read: `Nous croisons le prix publié par la CNSA et le niveau officiel attribué par la HAS (de A, le meilleur, à D). Les médianes ne sont affichées que pour les groupes d'au moins 20 établissements. La HAS évalue surtout l'organisation et la démarche qualité ; ce premier cycle d'évaluations se prête mal aux comparaisons fines.`,
      links: [["Les niveaux de qualité des EHPAD", "/actualites/qualite-ehpad-niveaux-has/"], ["Comment nous calculons la note", "/a-propos/"]],
    },
    {
      slug: "qualite-ehpad-niveaux-has", k: "Qualité", src: ["has", "finess"],
      title: "Qualité des EHPAD : les niveaux attribués par la HAS",
      head: `${int(ev)} EHPAD sur ${int(nat.n)} ont été évalués par la Haute Autorité de santé. ${pct(L.A + L.B, ev)} % ont obtenu le niveau A ou B.`,
      desc: `Répartition des EHPAD par niveau officiel de la HAS, de A (le meilleur) à D : ${int(L.A)} en A, ${int(L.B)} en B, ${int(L.C)} en C, ${int(L.D)} en D. ${int(ev)} EHPAD évalués sur ${int(nat.n)}.`,
      fig: pct(ev, nat.n) + " %", figl: "des EHPAD déjà évalués par la HAS",
      mini: `<div class="ml" aria-hidden="true">${[..."ABCD"].map((l) => `<i class="lv-${l}" style="flex:${L[l]}"></i>`).join("")}</div>`,
      body: () => `<div class="card pad"><p class="k">Nombre d'EHPAD par niveau officiel</p>${lvl(nat)}<p class="src">De A (le meilleur) à D. ${int(nat.n - ev)} EHPAD n'ont pas encore de résultat publié.</p></div>`,
      keys: [
        ...[..."ABCD"].map((l) => `Niveau ${l} : <b>${int(L[l])}</b> EHPAD (${pct(L[l], ev)} %).`),
        `${int(nat.n - ev)} EHPAD n'ont pas encore de résultat publié : ils ne sont pas classés sur le site.`,
      ],
      read: `Depuis 2023, chaque établissement est évalué par un organisme indépendant, selon le référentiel de la HAS. Le niveau officiel tient compte de la moyenne des objectifs et des exigences essentielles respectées. Sur chaque fiche, nous affichons ce niveau, une note sur 10 et le détail des 9 thèmes.`,
      links: [["Les EHPAD les plus chers sont-ils les mieux notés ?", "/actualites/prix-et-qualite-ehpad/"], ["Comment nous calculons la note", "/a-propos/"]],
    },
  ].filter(Boolean);
}

// ---------- page d'accueil des actualités ----------
const anaCard = (a) => `<a class="card ana" href="/actualites/${a.slug}/"><p class="k">${a.k}</p><h3>${esc(a.title)}</h3><div class="ana-f"><b class="num">${a.fig}</b><span>${esc(a.figl)}</span></div>${a.mini}<span class="more">Lire l'analyse →</span></a>`;

export function renderActusHub({ ana, news, meta }) {
  const last = news.map((a) => a.date).sort().at(-1);
  return `<section class="band"><div class="wrap"><h1>Actualités et chiffres des EHPAD</h1><p class="lede">Nos analyses calculées sur les données publiques, et l'actualité officielle du secteur.</p>
  <p class="upd">Chiffres recalculés le ${dateFr(meta.built)} · Dernière actualité le ${dateFr(last)}</p></div></section>
<section class="block"><div class="wrap">
  <h2>Nos analyses</h2>
  <div class="anas n${ana.length}">${ana.map(anaCard).join("")}</div>
</div></section>
<section class="block"><div class="wrap">
  <h2>Actualités</h2>
  <div class="news">${news.map((a) => `<article class="card"><time datetime="${a.date}">${dateFr(a.date)}</time><h3><a class="nt" href="/actualites/${a.slug}/">${esc(a.title)}</a></h3><p>${esc(a.text)}</p><p class="nsrc">Source : ${esc(a.source)}</p><a class="more" href="/actualites/${a.slug}/">Lire l'article →</a></article>`).join("")}</div>
</div></section>`;
}

// ---------- page d'une analyse ----------
export function renderAnalysis({ a, ana, meta }) {
  const others = ana.filter((x) => x.slug !== a.slug);
  return `<section class="band"><div class="wrap"><p class="crumb"><a href="/">Accueil</a><span>›</span><a href="/actualites/">Actualités</a></p>
  <p class="kicker">Analyse · ${a.k}</p><h1>${esc(a.title)}</h1><p class="lede">${a.head}</p>
  <p class="upd">Mis à jour le ${dateFr(meta.built)}</p></div></section>
<section class="block"><div class="wrap">
  ${a.body()}
  <div class="art-cols">
    <div class="card pad keys"><h2>À retenir</h2><ul>${a.keys.map((k) => `<li>${k}</li>`).join("")}</ul></div>
    <div class="card pad"><h2>Comment lire ces chiffres</h2><p>${a.read}</p><p class="src" style="margin-top:12px">${srcLine(a.src)}</p></div>
  </div>
  <div class="go"><h2>Pour aller plus loin</h2><div class="go-l">${a.links.map((l) => `<a href="${l[1]}">${esc(l[0])} →</a>`).join("")}<a href="/">Trouver un EHPAD près de chez vous →</a></div></div>
</div></section>
<section class="block"><div class="wrap">
  <h2>Autres analyses</h2>
  <div class="anas n${others.length}">${others.map(anaCard).join("")}</div>
</div></section>`;
}

// ---------- page d'une actualité ----------
export function renderNews({ n, news, ana }) {
  const others = news.filter((x) => x.slug !== n.slug).slice(0, 3);
  return `<section class="band"><div class="wrap"><p class="crumb"><a href="/">Accueil</a><span>›</span><a href="/actualites/">Actualités</a></p>
  <p class="kicker"><time datetime="${n.date}">${dateFr(n.date)}</time> · ${esc(n.source)}</p><h1>${esc(n.title)}</h1></div></section>
<section class="block"><div class="wrap art">
  <p class="art-lead">${esc(n.text)}</p>
  ${(n.body || []).map((p) => `<p>${esc(p)}</p>`).join("")}
  ${n.why ? `<div class="why big"><b>Ce que ça change pour vous</b><p>${esc(n.why)}</p></div>` : ""}
  <a class="srcb" href="${n.url}" target="_blank" rel="noopener"><span>Lire la source</span><b>${esc(n.source)}</b><small>${esc(host(n.url))} ↗</small></a>
  ${n.links?.length ? `<div class="go"><h2>Pour aller plus loin</h2><div class="go-l">${n.links.map((l) => `<a href="${l[1]}">${esc(l[0])} →</a>`).join("")}<a href="/">Trouver un EHPAD près de chez vous →</a></div></div>` : ""}
</div></section>
<section class="block"><div class="wrap">
  <h2>Autres actualités</h2>
  <div class="news">${others.map((a) => `<article class="card"><time datetime="${a.date}">${dateFr(a.date)}</time><h3><a class="nt" href="/actualites/${a.slug}/">${esc(a.title)}</a></h3><a class="more" href="/actualites/${a.slug}/">Lire l'article →</a></article>`).join("")}</div>
  <h2 class="mt">Nos analyses</h2>
  <div class="anas n3">${ana.slice(0, 3).map(anaCard).join("")}</div>
</div></section>`;
}

// ---------- données structurées ----------
export function articleLd({ url, title, desc, published, modified, kind = "Article", site }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": kind, headline: title, description: desc, datePublished: published, dateModified: modified, inLanguage: "fr-FR", mainEntityOfPage: url, image: site + "/og.png", author: { "@type": "Organization", name: "EHPAD Arena", url: site + "/" }, publisher: { "@type": "Organization", name: "EHPAD Arena", url: site + "/", logo: { "@type": "ImageObject", url: site + "/favicon.svg" } } },
      { "@type": "BreadcrumbList", itemListElement: [["Accueil", site + "/"], ["Actualités", site + "/actualites/"], [title, url]].map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x[0], item: x[1] })) },
    ],
  };
}

export { FIRST };
