"""Télécharge les trois sources officielles dans data/raw/ (hors du dépôt).

- CNSA : prix d'hébergement et tarifs dépendance des EHPAD (data.gouv.fr). On prend le dernier
  fichier annuel et les fichiers mensuels publiés après lui, qui contiennent les mises à jour.
- FINESS : extraction des établissements géolocalisés (data.gouv.fr).
- HAS : résultats d'évaluation des établissements sociaux et médico-sociaux (fichiers parquet
  hébergés par la HAS, référencés sur data.gouv.fr).
"""
import json, os, re, sys, time, urllib.request

API = "https://www.data.gouv.fr/api/1/datasets/"
CNSA = API + "prix-hebergement-et-tarifs-dependance-des-ehpad-donnees-brutes/"
FINESS = API + "finess-extraction-du-fichier-des-etablissements/"
HAS = API + "resultats-devaluation-des-etablissements-et-services-sociaux-et-medico-sociaux-essms/"
HAS_FILES = ["open_data_par_essms.parquet"]
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "raw")


def get(url, tries=5):
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return r.read()
        except Exception as e:  # serveurs parfois instables : on réessaie
            print(f"  essai {i + 1} échoué : {e}", file=sys.stderr)
            time.sleep(5 * (i + 1))
    raise SystemExit(f"Impossible de télécharger {url}")


def download(url, dest, size=None, tries=5):
    if os.path.exists(dest) and size and os.path.getsize(dest) == size:
        print(f"{os.path.basename(dest)} déjà à jour")
        return
    print(f"Téléchargement de {os.path.basename(dest)}…")
    for i in range(tries):
        try:
            tmp = dest + ".part"
            with urllib.request.urlopen(url, timeout=300) as r, open(tmp, "wb") as f:
                while chunk := r.read(1 << 20):
                    f.write(chunk)
            os.replace(tmp, dest)
            return
        except Exception as e:
            print(f"  essai {i + 1} échoué : {e}", file=sys.stderr)
            time.sleep(10 * (i + 1))
    raise SystemExit(f"Impossible de télécharger {url}")


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}

    # CNSA : dernier fichier annuel + mensuels postérieurs (le titre donne la période)
    meta = json.loads(get(CNSA))
    files = {}
    for r in meta["resources"]:
        m = re.search(r"prix[_-]ehpad[_-](\d{4}(?:\d{2})?)[_-]brute", r["title"])
        if m and r["format"].lower() == "csv":
            files[m.group(1)] = r
    years = sorted(p for p in files if len(p) == 4)
    if not years:
        raise SystemExit("Aucun fichier annuel CNSA trouvé")
    y = years[-1]
    periods = [y] + sorted(p for p in files if len(p) == 6 and p > y + "12")
    for f in os.listdir(OUT):  # on retire les anciens fichiers CNSA
        if f.startswith("cnsa-") and f[5:-4] not in periods:
            os.remove(os.path.join(OUT, f))
    for p in periods:
        r = files[p]
        download(r["url"], os.path.join(OUT, f"cnsa-{p}.csv"), r.get("filesize"))
    manifest["cnsa"] = {"periods": periods, "updated": max(files[p]["last_modified"][:10] for p in periods)}

    # FINESS : établissements géolocalisés (le plus récent)
    meta = json.loads(get(FINESS))
    geo = [r for r in meta["resources"] if "cs1100507" in r["url"] and r["format"].lower() == "csv"]
    geo.sort(key=lambda r: r["last_modified"])
    r = geo[-1]
    download(r["url"], os.path.join(OUT, "finess.csv"), r.get("filesize"))
    manifest["finess"] = {"title": r["title"], "updated": r["last_modified"][:10]}

    # HAS : évaluations par établissement
    meta = json.loads(get(HAS))
    for name in HAS_FILES:
        r = next(x for x in meta["resources"] if x["title"] == name)
        download(r["url"], os.path.join(OUT, name), r.get("filesize"))
        manifest["has"] = {"updated": r["last_modified"][:10]}

    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
