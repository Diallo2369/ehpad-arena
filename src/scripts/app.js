// Comportements du navigateur : menu, recherche, tri des listes, comparaison, « autour de moi », animations.
// Les pages sont déjà complètes en HTML ; ce script n'ajoute que l'interactivité.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const nb = (s) => s.replace(/[   ]/g, " ");
const eur = (n) => nb(Math.round(n).toLocaleString("fr-FR")) + " €";
const eur2 = (n) => nb(n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + " €";
const n1 = (v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const int = (v) => nb(Math.round(v).toLocaleString("fr-FR"));
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-'’]/g, " ").replace(/\s+/g, " ").trim();
const band = (v) => (v >= 9 ? "A" : v >= 8 ? "B" : v >= 6.5 ? "C" : "D");

// ---------- données chargées à la demande ----------
const cache = {};
const getJSON = (u) => (cache[u] ||= fetch(u).then((r) => { if (!r.ok) throw r; return r.json(); }).catch((e) => { delete cache[u]; throw e; }));

// ---------- animations : chiffres qui défilent ----------
const FMT = { eur, n1, int };
function countUp(root = document) {
  if (reduced) return;
  $$("[data-count]", root).forEach((el) => {
    const v = +el.dataset.count, f = FMT[el.dataset.fmt] || eur, fin = el.textContent, d = 900;
    let t0 = null;
    const step = (t) => { if (t0 === null) t0 = t; const k = Math.min(1, (t - t0) / d); el.textContent = k < 1 ? f(v * (1 - Math.pow(1 - k, 3))) : fin; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
countUp();

// ---------- menu mobile ----------
const menu = $("#menu"), burger = $("#burger");
const setMenu = (o) => { menu.hidden = !o; burger.setAttribute("aria-expanded", String(o)); burger.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu"); burger.classList.toggle("open", o); };
burger.addEventListener("click", () => setMenu(menu.hidden));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

// ---------- recherche ----------
const sov = $("#sov");
const openSearch = () => { setMenu(false); sov.hidden = false; document.body.classList.add("noscroll"); $("#q2").focus(); getJSON("/data/search.json").catch(() => {}); };
const closeSearch = () => { sov.hidden = true; document.body.classList.remove("noscroll"); };
$("#findBtn").addEventListener("click", () => { const q = $("#q"); if (q) { q.focus(); q.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }); } else openSearch(); });
$("#menuFind").addEventListener("click", openSearch);
$("#sovX").addEventListener("click", closeSearch);
sov.addEventListener("click", (e) => { if (e.target === sov) closeSearch(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sov.hidden) closeSearch(); });

let IDX = null;
async function index() {
  if (IDX) return IDX;
  const j = await getJSON("/data/search.json");
  IDX = {
    d: j.d,
    c: j.c.map((x) => ({ nom: x[0], dep: x[1], n: x[2], url: x[3] ? `/ehpad/${x[3]}/` : `/departement/${j.d[x[1]][1]}/`, k: norm(x[0]) })),
    e: j.e.map((x) => ({ nom: x[0], ville: x[1], url: `/etablissement/${x[2]}/`, k: norm(x[0]) })),
  };
  return IDX;
}
function match(q, I) {
  const n = norm(q);
  if (!n) return [];
  const out = [];
  for (const c of I.c) { if (c.k.startsWith(n) || c.k.includes(" " + n)) { out.push({ t: "c", ...c }); if (out.length >= 6) break; } }
  const es = [];
  if (n.length >= 3) for (const e of I.e) { if (e.k.includes(n)) { es.push({ t: "e", ...e }); if (es.length >= 4) break; } }
  return out.slice(0, es.length ? 5 : 7).concat(es);
}
function wireSearch(form) {
  const input = $("input", form), box = $(".sugg", form);
  let items = [], cur = -1;
  const draw = () => {
    box.hidden = !items.length && !input.value.trim();
    input.setAttribute("aria-expanded", String(!box.hidden));
    box.innerHTML = items.length ? items.map((it, i) => `<a role="option" id="${input.id}-o${i}" href="${it.url}" class="${i === cur ? "cur" : ""}"><span><b>${esc(it.nom)}</b> ${it.t === "c" ? `(${it.dep})` : `· ${esc(it.ville)}`}</span><small>${it.t === "c" ? (it.n ? `${it.n} EHPAD` : "Pas d'EHPAD, voir le département") : "Établissement"}</small></a>`).join("")
      : input.value.trim() ? '<p class="none">Aucune commune ni aucun établissement trouvé.</p>' : "";
    input.setAttribute("aria-activedescendant", cur >= 0 ? `${input.id}-o${cur}` : "");
  };
  input.addEventListener("focus", () => index().catch(() => {}));
  input.addEventListener("input", async () => {
    try { const I = await index(); items = match(input.value, I); cur = items.length ? 0 : -1; draw(); }
    catch { box.hidden = false; box.innerHTML = '<p class="none">La recherche est indisponible. Réessayez dans un instant.</p>'; }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && items.length) { cur = (cur + 1) % items.length; draw(); e.preventDefault(); }
    else if (e.key === "ArrowUp" && items.length) { cur = (cur - 1 + items.length) % items.length; draw(); e.preventDefault(); }
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); if (items[cur]) location.href = items[cur].url; });
  document.addEventListener("click", (e) => { if (!form.contains(e.target)) { box.hidden = true; input.setAttribute("aria-expanded", "false"); } });
}
$$("[data-search]").forEach(wireSearch);

// ---------- comparaison (gardée dans le navigateur) ----------
let sel = [];
try { const s = JSON.parse(localStorage.getItem("ea-sel") || "[]"); if (Array.isArray(s)) sel = s.filter((x) => /^\w{9}$/.test(x)).slice(0, 3); } catch {}
const save = () => { try { localStorage.setItem("ea-sel", JSON.stringify(sel)); } catch {} };
function toggle(id, force) {
  const i = sel.indexOf(id);
  if (i >= 0 && force !== true) sel.splice(i, 1);
  else if (i < 0) { if (sel.length >= 3) sel.shift(); sel.push(id); }
  save(); syncCmp();
}
function syncCmp() {
  $$("[data-cmp]").forEach((c) => { c.checked = sel.includes(c.dataset.cmp); });
  $$("[data-add]").forEach((b) => { b.textContent = sel.includes(b.dataset.add) ? "Dans votre comparaison" : "Ajouter à la comparaison"; });
  const t = $("#tray");
  if (t) t.innerHTML = sel.length ? `<div class="tray"><span><b>${sel.length}</b> sélectionné${sel.length > 1 ? "s" : ""} sur 3</span><a class="btn" href="/comparer/">Comparer</a></div>` : "";
}
document.addEventListener("change", (e) => { const c = e.target.closest("[data-cmp]"); if (c) toggle(c.dataset.cmp); });
document.addEventListener("click", (e) => { const b = e.target.closest("[data-add]"); if (b) toggle(b.dataset.add, true); });
syncCmp();

// ---------- listes : filtres, tri, rangs ----------
$$("[data-list]").forEach((wrap) => {
  const ul = $("ul.list", wrap);
  const rows = $$("li.row", ul);
  const sep = $("li.sep", ul);
  let filtre = "tous", ordre = "qual";
  const num = (r, k) => (r.dataset[k] === "" ? null : +r.dataset[k]);
  const qp = (r) => (num(r, "note") >= 0 && num(r, "mois") ? num(r, "note") / (num(r, "mois") / 1000) : null);
  function apply() {
    let l = rows.filter((r) => filtre === "ash" ? r.dataset.ash === "1" : filtre === "eval" ? num(r, "note") >= 0 : true);
    const p = (r) => num(r, "mois") ?? 1e9;
    const ranked = ordre === "qual" || ordre === "qp";
    const key = ordre === "qp" ? qp : (r) => (num(r, "note") >= 0 ? num(r, "note") : null);
    l.sort(ordre === "nom" ? (a, b) => a.dataset.nom.localeCompare(b.dataset.nom, "fr")
      : ordre === "cher" ? (a, b) => (num(b, "mois") ?? -1) - (num(a, "mois") ?? -1)
      : ordre === "prix" ? (a, b) => p(a) - p(b)
      : ordre === "qual" ? (a, b) => (+a.dataset.lv - +b.dataset.lv) || ((key(b) ?? -1) - (key(a) ?? -1)) || (p(a) - p(b))
      : (a, b) => ((key(b) ?? -1) - (key(a) ?? -1)) || (p(a) - p(b)));
    rows.forEach((r) => (r.hidden = true));
    let rank = 0, sepPlaced = false;
    if (sep) sep.hidden = true;
    for (const r of l) {
      const ok = ranked ? key(r) != null : false;
      if (ranked && !ok && !sepPlaced && sep) { sep.hidden = false; sep.textContent = ordre === "qp" ? "Non classés : note ou prix manquant" : "Non classés : pas encore de résultat publié par la HAS"; ul.append(sep); sepPlaced = true; }
      r.hidden = false; ul.append(r);
      let rk = $(".rank", r);
      if (ok) { if (!rk) { rk = document.createElement("span"); rk.className = "rank num"; $("h3", r).prepend(rk); } rk.textContent = ++rank; }
      else if (rk) rk.remove();
    }
  }
  $$("[data-f]", wrap).forEach((b) => b.addEventListener("click", () => { filtre = b.dataset.f; $$("[data-f]", wrap).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); apply(); }));
  const s = $("[data-sort]", wrap);
  if (s) s.addEventListener("change", () => { ordre = s.value; apply(); });
});

// ---------- page « Votre comparaison » ----------
const cmpEl = $("#cmp");
if (cmpEl) {
  getJSON("/data/ehpad.json").then((E) => {
    const l = sel.map((id) => [id, E[id]]).filter((x) => x[1]);
    if (l.length < 2) {
      cmpEl.innerHTML = `<p class="tx">Cochez « Comparer » sur 2 ou 3 établissements, depuis la page d'une commune ou d'un établissement, pour les voir côte à côte.</p><p style="margin-top:18px"><button type="button" class="btn" id="cmpFind">Rechercher une commune</button></p>`;
      $("#cmpFind").addEventListener("click", openSearch);
      return;
    }
    const row = (t, f) => `<tr><th scope="row">${t}</th>${l.map(([id, x]) => `<td class="num">${f(x, id)}</td>`).join("")}</tr>`;
    cmpEl.innerHTML = `<div class="card scroll"><table>
      <thead><tr><th></th>${l.map(([id, x]) => `<th scope="col"><a href="/etablissement/${x[2]}/">${esc(x[0])}</a><small>${esc(x[1])}</small></th>`).join("")}</tr></thead>
      <tbody>
        ${row("Prix par mois", (x) => (x[3] ? `<b class="p">${eur(x[3])}</b>` : "Non déclaré"))}
        ${row("Hébergement par jour", (x) => (x[11] ? eur2(x[11]) : "–"))}
        ${row("Dépendance par jour", (x) => (x[12] ? eur2(x[12]) : "–"))}
        ${row("Note sur 10", (x) => (x[4] != null ? `<div class="grade g-${band(x[4])}">${n1(x[4])}</div>` : "Non classé"))}
        ${row("Niveau officiel HAS, de A (le meilleur) à D", (x) => x[5] || "Pas encore publié")}
        ${row("Exigences essentielles respectées", (x) => (x[7] != null ? `${x[7]} sur ${x[8]}` : "–"))}
        ${row("Aide sociale", (x) => (x[6] ? "Acceptée" : "Non habilité"))}
        ${row("Statut", (x) => esc(x[13] || "–"))}
      </tbody></table></div>
      <p style="margin-top:16px"><button type="button" class="btn ghost" id="cmpClear">Vider la comparaison</button></p>`;
    $("#cmpClear").addEventListener("click", () => { sel = []; save(); location.reload(); });
  }).catch(() => { cmpEl.innerHTML = '<p class="tx">La comparaison est indisponible pour le moment. Réessayez dans un instant.</p>'; });
}

// ---------- « Autour de moi » ----------
const nearBtn = $("[data-near]");
if (nearBtn) {
  const out = $("#near");
  nearBtn.addEventListener("click", () => {
    if (!navigator.geolocation) { out.hidden = false; out.innerHTML = '<p class="none">Votre navigateur ne permet pas de vous localiser. Saisissez votre commune.</p>'; return; }
    out.hidden = false; out.innerHTML = '<p class="none">Recherche de votre position…</p>';
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const E = await getJSON("/data/ehpad.json");
        const { latitude: la, longitude: lo } = pos.coords;
        const R = Math.PI / 180;
        const d = (a, b) => 6371 * 2 * Math.asin(Math.sqrt(Math.sin(((a[0] - la) * R) / 2) ** 2 + Math.cos(la * R) * Math.cos(a[0] * R) * Math.sin(((a[1] - lo) * R) / 2) ** 2));
        const l = Object.values(E).filter((x) => x[9] != null).map((x) => [d([x[9], x[10]]), x]).sort((a, b) => a[0] - b[0]).slice(0, 10);
        out.innerHTML = `<p class="near-t">Les 10 EHPAD les plus proches</p><ul>${l.map(([km, x]) => `<li><a href="/etablissement/${x[2]}/"><b>${esc(x[0])}</b><span>${esc(x[1])} · ${km < 1 ? "moins d'1 km" : n1(km).replace(",0", "") + " km"}</span></a><em class="num">${x[3] ? eur(x[3]) : "–"}</em></li>`).join("")}</ul>`;
      } catch { out.innerHTML = '<p class="none">Impossible de charger les établissements. Réessayez dans un instant.</p>'; }
    }, () => { out.innerHTML = '<p class="none">Position non disponible. Saisissez votre commune dans le champ ci-dessus.</p>'; }, { timeout: 10000, maximumAge: 600000 });
  });
}
