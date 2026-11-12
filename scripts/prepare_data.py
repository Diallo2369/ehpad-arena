"""Croise les trois sources et écrit les données du site.

Entrées (data/raw/) : cnsa-*.csv (prix), finess.csv (annuaire), open_data_par_essms.parquet (HAS).
Sorties :
  data/build/site.json   tout ce qu'il faut pour construire les pages
  public/data/search.json  index léger pour la recherche (communes et établissements)
  public/data/ehpad.json   résumé de chaque EHPAD pour la comparaison et « autour de moi »

Règles (voir aussi la page À propos) :
- prix par mois = (hébergement chambre seule + tarif dépendance GIR 5-6) × 30 jours, avant les aides ;
- note sur 10 = 70 % moyenne des 9 thèmes HAS (notés de 1 à 4) + 30 % exigences essentielles respectées ;
- classement : niveau officiel HAS (A, B, C, D), puis note, puis prix.
"""
import csv, glob, json, os, re, statistics as st, sys, unicodedata
from collections import defaultdict

ROOT = os.path.join(os.path.dirname(__file__), "..")
RAW = os.path.join(ROOT, "data", "raw")
NM = os.path.join(ROOT, "node_modules", "@etalab", "decoupage-administratif", "data")

THEMES = ["Bientraitance et éthique", "Droits de la personne", "Projet d'accompagnement personnalisé",
          "Expression et participation", "Accompagnement à l'autonomie", "Accompagnement à la santé",
          "Continuité des parcours", "Ressources humaines", "Démarche qualité et gestion des risques"]
LEVELS = "ABCD"
PLM = {"75056": "751", "13055": "132", "69123": "693"}  # villes à arrondissements : préfixe des codes


# ---------- outils ----------
def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def num(s):
    s = (s or "").strip().replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def inrange(v, lo, hi):
    return v if v is not None and lo <= v <= hi else None


SMALL = {"de", "du", "des", "la", "le", "les", "et", "a", "au", "aux", "en", "sur", "sous", "l", "d", "pour", "par"}
KEEP = {"EHPAD", "CH", "CHU", "CHR", "CHRU", "CHI", "CCAS", "CIAS", "USLD", "EHPA", "MAPA", "MAPAD", "SSR", "UVP", "UHR",
        "PASA", "ADMR", "MGEN", "MSA", "SNCF", "RATP", "AP-HP", "APHP", "HL", "CHG", "CHS", "CHD", "GCSMS", "SAS", "SARL",
        "ACPPA", "ORPEA", "PUV", "MARPA", "EHPAD-USLD", "ARPAVIE", "STV", "II", "III", "IV", "XV", "XVI", "XIV", "XIII", "XII", "XI", "UGECAM", "EPMS"}


def nice(s, small_first=False):
    """Remet en forme un nom écrit en majuscules dans FINESS (accents courants rétablis)."""
    s = re.sub(r"\s+", " ", (s or "").strip())
    if not s:
        return s
    if s != s.upper():
        return s
    out = []
    for i, w in enumerate(re.split(r"(\s+|-|'|’|/|\()", s)):
        if not w or re.fullmatch(r"\s+|-|'|’|/|\(", w):
            out.append(w)
            continue
        low = w.lower()
        low = ACCENTS.get(low, low) if w == w.upper() else low
        if w in KEEP:
            out.append(w)
        elif (i > 0 or small_first) and low in SMALL:
            out.append(low)
        elif w.isdigit():
            out.append(w)
        else:
            out.append(low[:1].upper() + low[1:])
    r = "".join(out)
    r = re.sub(r"\b([LD])'", lambda m: m.group(1).lower() + "'", r)
    return r if small_first else r[:1].upper() + r[1:]


ACCENTS = {w.lower().replace("é","e").replace("è","e").replace("ê","e").replace("â","a").replace("à","a").replace("ô","o").replace("î","i").replace("ç","c").replace("û","u").replace("œ","oe").replace("ë","e").replace("ï","i"): w for w in (
    "résidence résidences âgées dépendantes établissement hébergement hébergeant hôpital général générale santé "
    "château chêne chênes cèdre cèdres vallée pré prés près forêt église république maréchal abbé élisabeth "
    "rené andré léon émile françois eugène hélène thérèse geneviève cécile frédéric gérard hervé gaëtan joséphine "
    "édouard étienne léopold privée unité étoile prieuré clairière liberté libération résistance espérance orée "
    "rivière orchidées bruyères écoles côte frères père mère sœurs sœur cœur sacré genêts médicis aînés pôle étang "
    "président théodore mélanie jérôme valérie amélie séverine noël joël raphaël michèle hélios fénelon bérénice "
    "tête île quai montée dépendance âge accueil").split()}
ACCENTS.update({"soeurs": "sœurs", "soeur": "sœur", "coeur": "cœur", "agees": "âgées", "ages": "âgés"})

VOIES = {"R": "rue", "RUE": "rue", "AV": "avenue", "BD": "boulevard", "PL": "place", "CHE": "chemin", "CHEM": "chemin",
         "RTE": "route", "ALL": "allée", "IMP": "impasse", "QUAI": "quai", "QU": "quai", "CRS": "cours", "SQ": "square",
         "PASS": "passage", "LD": "lieu-dit", "FG": "faubourg", "RPT": "rond-point", "PROM": "promenade", "PRO": "promenade",
         "MTE": "montée", "CHS": "chaussée", "ESP": "esplanade", "HAM": "hameau", "RES": "résidence", "CITE": "cité",
         "SEN": "sentier", "TRA": "traverse", "VLA": "villa", "DOM": "domaine", "PTE": "porte", "PARC": "parc",
         "ZA": "ZA", "ZI": "ZI", "ZAC": "ZAC", "LOT": "lotissement", "CAR": "carrefour", "VOIE": "voie", "VC": "voie communale",
         "CC": "centre commercial", "CTRE": "centre", "QUA": "quartier", "BRG": "bourg", "MAIL": "mail", "CLOS": "clos",
         "COR": "corniche", "GR": "grande rue", "PLN": "plaine", "PLT": "plateau", "PONT": "pont", "PORT": "port", "VAL": "val"}


def address(r):
    num_, typ, voie, comp, ld = r[7].strip(), r[8].strip(), r[9].strip(), r[10].strip(), r[11].strip()
    parts = []
    if voie:
        parts.append(" ".join(x for x in [num_ + (comp.lower() if len(comp) <= 3 else ""), VOIES.get(typ.upper(), typ.lower()), nice(voie, True)] if x))
    if ld and not ld.upper().startswith("BP"):
        parts.append(nice(ld))
    a = ", ".join(parts)
    a = re.sub(r"[\s,-]*\b(BP|CS|Bp|Cs)\s*\d+.*$", "", a).strip(" ,-")
    return a


GENERIC = re.compile(r"^(etablissement|etab|ets|maison d.accueil|ehpad|hebergement)?[\s'’d]*(heb|hebergement|hebergt|hebgt|accueil|pour)?\b.*(personnes?|pers)\.?\s+ag", re.I)


PREFIX = re.compile(r"^(etablissement|etab|ets)\.?\s+(d\s*['’ ]\s*)?(hebergement|hebergeant|hebergt|hebgt|heberg|h)\.?\s+(pour\s+|pr\s+|p\s+|des\s+)?(les\s+)?(personnes|pers|p)\.?\s*(agees|ag|a)\.?\s*(dependantes|dep|d)?\.?\s*[-–]?\s*", re.I)


def pick_name(rs, rsl):
    """Le nom long est préféré, sauf s'il est générique (« Établissement d'hébergement pour personnes âgées… »)."""
    plain = lambda x: unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode()
    rs, rsl = (rs or "").strip(), (rsl or "").strip()
    if rsl and GENERIC.match(plain(rsl)) and rs and not GENERIC.match(plain(rs)):
        name = rs
    else:
        name = rsl or rs
    name = re.sub(r"^E\.?\s?H\.?\s?P\.?\s?A\.?\s?D\.?(?=\s|$)", "EHPAD", name.strip(), flags=re.I)
    m = PREFIX.match(plain(name))
    if m and len(plain(name)) > m.end() + 2:  # « Établissement d'hébergement pour PA la Maison du Parc » -> « EHPAD la Maison du Parc »
        name = "EHPAD " + name[m.end():]
    return nice(name)


def phone(t):
    t = re.sub(r"\D", "", t or "")
    return " ".join(t[i:i + 2] for i in range(0, 10, 2)) if len(t) == 10 else ""


def median(v):
    return round(st.median(v)) if v else None


# ---------- référentiel des communes ----------
def load_communes():
    com = json.load(open(os.path.join(NM, "communes.json"), encoding="utf-8"))
    deps = {d["code"]: (d["nom"], d.get("typeLiaison", 1)) for d in json.load(open(os.path.join(NM, "departements.json"), encoding="utf-8"))}
    cur, alias = {}, {}
    for c in com:
        if c["type"] in ("commune-actuelle", "arrondissement-municipal"):
            cur[c["code"]] = c
    for c in com:
        if c["type"] in ("commune-deleguee", "commune-associee") and c.get("chefLieu") in cur:
            alias.setdefault(c["code"], c["chefLieu"])
    return cur, alias, deps


DOM = {"9A": "971", "9B": "972", "9C": "973", "9D": "974", "9E": "975", "9F": "976"}


def insee(r):
    dep, com = r[13].strip(), r[12].strip()
    if dep in DOM:
        return "97" + com
    return dep + com


# ---------- coordonnées ----------
def to_wgs84(points):
    """points : {finess: (x, y, epsg)} -> {finess: (lat, lon)}"""
    from pyproj import Transformer
    tr, out = {}, {}
    for k, (x, y, epsg) in points.items():
        if epsg not in tr:
            tr[epsg] = Transformer.from_crs(epsg, 4326, always_xy=True)
        lon, lat = tr[epsg].transform(x, y)
        if -90 <= lat <= 90 and -180 <= lon <= 180:
            out[k] = (round(lat, 5), round(lon, 5))
    return out


def epsg_of(src):
    m = re.search(r"EPSG:(\d+)", src)
    if m:
        return int(m.group(1))
    if "UTM zone 21N" in src:
        return 32621
    return None


# ---------- lecture des sources ----------
def read_finess(cur, alias):
    rows, pts = {}, {}
    with open(os.path.join(RAW, "finess.csv"), encoding="utf-8", errors="replace", newline="") as h:
        for r in csv.reader(h, delimiter=";"):
            if r[0] == "structureet" and len(r) > 25 and r[18] == "500":
                rows[r[1]] = r
            elif r[0] == "geolocalisation" and len(r) > 4:
                e = epsg_of(r[4])
                x, y = num(r[2]), num(r[3])
                if e and x is not None and y is not None:
                    pts[r[1]] = (x, y, e)
    coords = to_wgs84({k: v for k, v in pts.items() if k in rows})
    out, unknown = {}, []
    for k, r in rows.items():
        code = insee(r)
        code = code if code in cur else alias.get(code) or {"97127": "97801", "97123": "97701"}.get(code)
        if not code:
            unknown.append((k, insee(r), r[15]))
            continue
        mft = r[25].lower()
        out[k] = {
            "id": k,
            "nom": pick_name(r[3], r[4]),
            "adr": address(r),
            "cp": r[15][:5],
            "c": code,
            "tel": phone(r[16]),
            "ash": "habilit" in mft and "non hab" not in mft,
            "geo": coords.get(k),
        }
    return out, unknown


def read_cnsa():
    files = sorted(glob.glob(os.path.join(RAW, "cnsa-*.csv")), key=lambda f: (len(f), f))  # annuel puis mensuels
    if not files:
        raise SystemExit("Aucun fichier CNSA dans data/raw (lancez npm run data:fetch)")
    prix = {}
    for f in files:
        with open(f, encoding="utf-8-sig", errors="replace", newline="") as h:
            for r in csv.DictReader(h, delimiter=";"):
                prix[r["finessEt"].strip()] = r
    out = {}
    for k, r in prix.items():
        cs = inrange(num(r.get("prixHebPermCs")), 30, 300)
        g56 = inrange(num(r.get("TARIF_GIR_56")), 2, 15)
        e = {
            "cs": cs,
            "cd": inrange(num(r.get("prixHebPermCd")), 30, 300),
            "csa": inrange(num(r.get("prixHebPermCsa")), 30, 300),
            "g56": g56,
            "maj": (r.get("DATE_MAJ") or "")[:10],
            "inclus": re.sub(r"\s+", " ", (r.get("AUTRE_PRESTATION_INCLUSE") or "")).strip()[:300],
            "autre": re.sub(r"\s+", " ", (r.get("AUTRES_PRIX_OU_PRESTATIONS") or "")).strip()[:300],
        }
        if e["autre"] == e["inclus"]:
            e["autre"] = ""
        e["mois"] = round((cs + g56) * 30) if cs and g56 else None
        out[k] = e
    return out, [os.path.basename(f)[5:-4] for f in files]


def read_has():
    import pyarrow.parquet as pq
    t = pq.read_table(os.path.join(RAW, "open_data_par_essms.parquet")).to_pylist()
    th = [f"cotation_globale_thematique_0.{i}" for i in range(1, 10)]
    out = {}
    for r in t:
        if str(r.get("essms_categ_finess_code")) != "500" or not r.get("indice_qualite"):
            continue
        vals = [r.get(c) for c in th]
        if any(v is None for v in vals) or not r.get("nb_ci"):
            continue
        d = r.get("eval_date_cloture_tech") or r.get("eval_date_fin")
        e = {
            "n": r["indice_qualite"],
            "ci": int(r.get("nb_ci_atteints") or 0),
            "nci": int(r["nb_ci"]),
            "th": [round(float(v), 2) for v in vals],
            "d": d.strftime("%Y-%m-%d") if d else "",
            "ev": nice(r.get("oe_nom") or ""),
            "st": r.get("essms_statut_juridique") or "",
            "multi": bool(r.get("multi_essms")),
        }
        m = sum(e["th"]) / 9
        e["note"] = round(10 * (0.7 * m / 4 + 0.3 * e["ci"] / e["nci"]), 2)
        prev = out.get(r["finess_geo"])
        if not prev or e["d"] > prev["d"]:
            out[r["finess_geo"]] = e
    return out


# ---------- assemblage ----------
def rank_key(e):
    h = e.get("has")
    return (LEVELS.index(h["n"]) if h else 9, -(h["note"] if h else 0), e.get("mois") or 1e9, e["nom"])


def main():
    cur, alias, depnames = load_communes()
    fin, unknown = read_finess(cur, alias)
    prix, periods = read_cnsa()
    has = read_has()
    manifest = json.load(open(os.path.join(RAW, "manifest.json"))) if os.path.exists(os.path.join(RAW, "manifest.json")) else {}

    E = {}
    for k, f in fin.items():
        e = dict(f)
        p = prix.get(k)
        if p:
            e.update({x: p[x] for x in ("cs", "cd", "csa", "g56", "mois", "maj", "inclus", "autre")})
        if k in has:
            e["has"] = has[k]
        c = cur[e["c"]]
        e["ville"] = c["nom"]
        e["dep"] = c["departement"]
        e["slug"] = f"{slugify(e['nom'])[:70].strip('-')}-{slugify(re.sub(r' \d+e Arrondissement$', '', c['nom']))}-{k}"
        E[k] = e

    # communes (arrondissements pour Paris, Lyon, Marseille) et villes à arrondissements
    by_c = defaultdict(list)
    for e in E.values():
        by_c[e["c"]].append(e["id"])
    C = {}
    for code, ids in by_c.items():
        c = cur[code]
        C[code] = {"c": code, "nom": c["nom"], "dep": c["departement"], "pop": c.get("population") or 0, "ids": ids,
                   "parent": c.get("commune")}
    for city, pre in PLM.items():
        kids = sorted(k for k in C if k.startswith(pre) and k != city)
        if kids:
            c = cur[city]
            C[city] = {"c": city, "nom": c["nom"], "dep": c["departement"], "pop": c.get("population") or 0,
                       "ids": [i for k in kids for i in C[k]["ids"]], "kids": kids}

    D = defaultdict(list)
    for e in E.values():
        D[e["dep"]].append(e["id"])

    def summary(ids):
        es = [E[i] for i in ids]
        es.sort(key=rank_key)
        m = [e["mois"] for e in es if e.get("mois")]
        notes = sorted(e["has"]["note"] for e in es if e.get("has"))
        return {
            "ids": [e["id"] for e in es],
            "n": len(es),
            "np": len(m),
            "nh": len(notes),
            "med": median(m),
            "min": min(m) if m else None,
            "max": max(m) if m else None,
            "nmed": round(st.median(notes), 2) if notes else None,
        }

    for code, c in C.items():
        c.update(summary(c["ids"]))
        base = re.sub(r" (\d+)(e|er) Arrondissement$", r" \1\2", c["nom"])
        c["nom"] = base
        c["slug"] = f"{slugify(base)}-{code}"
    deps = {}
    for code, ids in D.items():
        d = {"code": code, "nom": depnames.get(code, (code, 1))[0], "tl": depnames.get(code, (code, 1))[1]}
        d.update(summary(ids))
        d["slug"] = f"{slugify(d['nom'])}-{code}"
        d["communes"] = sorted([k for k, c in C.items() if c["dep"] == code and "kids" not in c],
                               key=lambda k: (-C[k]["n"], C[k]["nom"]))
        deps[code] = d

    # rangs : dans la commune (classés seulement) et dans le département ; position de prix
    for scope, groups in (("rc", {k: c for k, c in C.items() if "kids" not in c}), ("rd", deps)):
        for g in groups.values():
            ranked = [i for i in g["ids"] if E[i].get("has")]
            for pos, i in enumerate(ranked):
                E[i][scope] = [pos + 1, len(ranked)]
            priced = sorted((i for i in g["ids"] if E[i].get("mois")), key=lambda i: E[i]["mois"])
            for pos, i in enumerate(priced):
                E[i]["p" + scope] = [pos + 1, len(priced)]

    # chiffres nationaux
    allm = sorted(e["mois"] for e in E.values() if e.get("mois"))
    q = st.quantiles(allm, n=10)
    bins = defaultdict(int)
    for m in allm:
        bins[min(max(int(m // 250) * 250, 1750), 4000)] += 1
    depmed = sorted(((d["med"], k) for k, d in deps.items() if d["np"] >= 10))
    ashm = [e["mois"] for e in E.values() if e.get("mois") and e["ash"]]
    nonm = [e["mois"] for e in E.values() if e.get("mois") and not e["ash"]]
    lv = defaultdict(int)
    for e in E.values():
        if e.get("has"):
            lv[e["has"]["n"]] += 1
    nat = {
        "n": len(E), "np": len(allm), "nh": sum(lv.values()),
        "med": median(allm), "d1": round(q[0]), "d9": round(q[8]),
        "hist": [[k, bins[k]] for k in sorted(bins)],
        "cher": [[deps[k]["nom"], m] for m, k in depmed[::-1][:5]],
        "moins": [[deps[k]["nom"], m] for m, k in depmed[:5]],
        "ash": [len(ashm), median(ashm), len(nonm), median(nonm)],
        "nash": sum(1 for e in E.values() if e["ash"]),
        "levels": {k: lv[k] for k in LEVELS},
    }

    meta = {
        "built": __import__("datetime").date.today().isoformat(),
        "cnsa": periods, "cnsaUpdated": manifest.get("cnsa", {}).get("updated", ""),
        "hasUpdated": manifest.get("has", {}).get("updated", ""), "finess": manifest.get("finess", {}).get("title", ""),
        "unknownCommunes": len(unknown), "hasNotInFiness": sum(1 for k in has if k not in fin),
    }
    os.makedirs(os.path.join(ROOT, "data", "build"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "public", "data"), exist_ok=True)
    json.dump({"meta": meta, "themes": THEMES, "nat": nat, "ehpad": E, "communes": C, "deps": deps},
              open(os.path.join(ROOT, "data", "build", "site.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    # recherche : toutes les communes (celles sans EHPAD renvoient à leur département) + établissements
    sc = []
    for code, c in cur.items():
        if c["type"] == "arrondissement-municipal" and code not in C:
            continue
        if code not in C and c["departement"] not in deps:
            continue
        sc.append((c.get("population") or 0, [C[code]["nom"] if code in C else c["nom"], c["departement"], C[code]["n"] if code in C else 0, C[code]["slug"] if code in C else 0]))
    sc.sort(key=lambda x: -x[0])
    se = [[e["nom"], e["ville"], e["slug"]] for e in sorted(E.values(), key=lambda e: e["nom"])]
    json.dump({"d": {k: [d["nom"], d["slug"]] for k, d in deps.items()}, "c": [x[1] for x in sc], "e": se},
              open(os.path.join(ROOT, "public", "data", "search.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    # résumé par établissement pour la comparaison et « autour de moi »
    small = {}
    for k, e in E.items():
        h = e.get("has")
        small[k] = [e["nom"], e["ville"], e["slug"], e.get("mois"), h["note"] if h else None, h["n"] if h else None,
                    1 if e["ash"] else 0, h["ci"] if h else None, h["nci"] if h else None,
                    e["geo"][0] if e.get("geo") else None, e["geo"][1] if e.get("geo") else None,
                    e.get("cs"), e.get("g56"), h["st"] if h else "", h["d"] if h else ""]
    json.dump(small, open(os.path.join(ROOT, "public", "data", "ehpad.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    print(f"{len(E)} EHPAD, {len(allm)} avec prix complet, {nat['nh']} évalués ; {len(C)} communes, {len(deps)} départements.")
    print(f"Prix médian {nat['med']} € ; communes inconnues : {len(unknown)} ; évaluations HAS hors FINESS : {meta['hasNotInFiness']}.")
    for u in unknown[:10]:
        print("  commune inconnue :", u, file=sys.stderr)


if __name__ == "__main__":
    main()
