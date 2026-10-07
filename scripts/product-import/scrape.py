#!/usr/bin/env python3
"""Scrape supplier websites into a local catalog for import into the shop.

Sources: Doğanlar (door handles / pull handles), Umut Kulp (cabinet handles /
knobs) and Starax (kitchen / wardrobe / bathroom systems).

Nothing is uploaded here. Output goes to data/:
  data/catalog.json            one entry per product
  data/images/<source>/<sku>/  downloaded images, in display order

Re-running is cheap: pages and images already on disk are reused.

Usage:  python3 scrape.py [doganlar] [umut] [starax]   (default: all)
"""

import html
import json
import re
import ssl
import subprocess
import sys
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
CACHE = DATA / "cache"
IMAGES = DATA / "images"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) HarunYapiMarket-catalog-import"
DELAY = 0.4  # seconds between live requests, to be gentle with supplier sites

# ---------------------------------------------------------------------------
# What the shop asked for (from the WhatsApp list, 2026-10-07)
# ---------------------------------------------------------------------------

DOGANLAR_ROZETLI = """VERSA EXEN VERİTA MARİN TORE FEST TERRA TERMO KORT SORE LT LORE BT BONT
BOSFOR TECHNO SONİC PRİZMA FALCON RADYA AVATAR VENEDİK DRAGON RAMSEY PARMA TURKUAZ
LİNEA PERA KARMA ANKA HERA PİER PENTA BORA RODOS GİRİT BERAT FULYA SİMGE FIRAT
EKSELANS""".split()

DOGANLAR_CEKME = "DRAGON BOSFOR TERMO FALCON TECHNO ABİDE EKSELANS HAYAL".split()

UMUT_KULP = "395 396 300 301 303 550 640 705 776 835 836 837 838 1040 1074 1057".split()
UMUT_DUGME = "12 14 18 25 30 39 46 63 73 74 79 82".split()

# Doğanlar product slugs that don't follow the model name
DOGANLAR_CEKME_SLUG = {"EKSELANS": "urun-eekselans", "ABİDE": "product-abide"}


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

_last_request = 0.0


def fetch(url, binary=False, cache=True):
    """GET a URL, caching HTML pages on disk."""
    global _last_request
    key = CACHE / (re.sub(r"[^A-Za-z0-9._-]+", "_", url)[-180:] + ".html")
    if cache and not binary and key.exists():
        return key.read_text(encoding="utf-8")
    wait = DELAY - (time.time() - _last_request)
    if wait > 0:
        time.sleep(wait)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            break
        except urllib.error.URLError as e:
            # Some supplier sites serve an incomplete certificate chain that
            # Python can't verify but the system curl (macOS keychain) can.
            if not isinstance(getattr(e, "reason", None), ssl.SSLCertVerificationError):
                if attempt == 2 or getattr(e, "code", None) == 404:
                    raise
                print(f"  retry {url}: {e}")
                time.sleep(2 * (attempt + 1))
                continue
            body = subprocess.run(["curl", "-sSfL", "-m", "60", "-A", UA, url],
                                  check=True, capture_output=True).stdout
            break
        except Exception as e:  # noqa: BLE001 - retry any network error
            if attempt == 2 or getattr(e, "code", None) == 404:
                raise
            print(f"  retry {url}: {e}")
            time.sleep(2 * (attempt + 1))
    _last_request = time.time()
    if binary:
        return body
    text = body.decode("utf-8", errors="replace")
    if cache:
        key.parent.mkdir(parents=True, exist_ok=True)
        key.write_text(text, encoding="utf-8")
    return text


def text_of(fragment):
    t = re.sub(r"<br\s*/?>", "\n", fragment)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(t)
    return re.sub(r"[ \t\xa0]+", " ", t).strip()


def fold(s):
    """Case/diacritic-insensitive key: 'VERİTA' -> 'verita'."""
    s = s.replace("İ", "i").replace("I", "ı").lower()
    return s.translate(str.maketrans("çğıöşü", "cgiosu"))


def tr_title(word):
    """'VERİTA' -> 'Verita'; short codes like 'LT' stay upper."""
    if len(word) <= 3:
        return word
    first, rest = word[0], word[1:]
    return first + rest.replace("I", "ı").replace("İ", "i").lower()


def download_images(source, sku, urls):
    folder = IMAGES / source / re.sub(r"[^A-Za-z0-9._-]+", "_", sku)
    folder.mkdir(parents=True, exist_ok=True)
    paths = []
    for i, url in enumerate(urls):
        ext = Path(urllib.parse.urlparse(url).path).suffix.lower() or ".jpg"
        if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            continue
        dest = folder / f"{i:02d}{ext}"
        if not dest.exists():
            try:
                dest.write_bytes(fetch(url, binary=True))
            except Exception as e:  # noqa: BLE001
                print(f"  ! image failed {url}: {e}")
                continue
        paths.append(str(dest.relative_to(DATA)))
    return paths


# ---------------------------------------------------------------------------
# Doğanlar  (doganlar.com.tr - server-rendered Django site)
# ---------------------------------------------------------------------------

DOG = "https://doganlar.com.tr"


def doganlar_slugs(category):
    slugs = set()
    for page in range(1, 20):
        try:
            h = fetch(f"{DOG}/tr/products/?category={category}&page={page}")
        except urllib.error.HTTPError as e:
            if e.code == 404:  # past the last page
                break
            raise
        found = set(re.findall(r'href="/tr/products/([^"?/]+)/"', h))
        if not found - slugs:
            break
        slugs |= found
    return slugs


def doganlar_find_slug(name, slugs):
    want = fold(name)
    for s in slugs:
        if fold(s) in (want, f"{want}-urun", f"urun-{want}", f"product-{want}"):
            return s
    return None


def doganlar_product(slug):
    url = f"{DOG}/tr/products/{slug}/"
    h = fetch(url)

    def field(label):
        m = re.search(rf"<strong>{label}:</strong>(.*?)</li>", h, re.S)
        return text_of(m.group(1)) if m else ""

    slides = re.search(r'<ul class="slides">(.*?)</ul>', h, re.S)
    images = re.findall(r'<img[^>]+src="([^"]+)"', slides.group(1)) if slides else []
    images = [u for u in images if "Bos_PNG" not in u]  # placeholder "empty" image
    drawings = re.findall(r'<div class="tab-content">\s*<img[^>]+src="([^"]+)"', h)
    color_box = re.search(r'<span class="product-colors">(.*?)</li>', h, re.S)
    colors = [text_of(c) for c in re.findall(r"<span>(.*?)</span>", color_box.group(1))] if color_box else []
    colors = [c for c in colors if c and c != "-"]
    code = field("Ürün Kodu")
    return {
        "url": url,
        "colors": colors,
        "code": "" if code in ("None", "-") else code,
        "designer": "" if field("Tasarımcı") in ("", "-") else field("Tasarımcı"),
        "category": field("Ürün Kategorisi"),
        "images": images + drawings,
    }


def doganlar_description(p, kind):
    parts = [f"<p>Doğanlar {kind}.</p>", "<ul>"]
    # A few pages list every finish Doğanlar makes; that's noise, not options.
    if p["colors"] and len(p["colors"]) <= 12:
        parts.append(f"<li><strong>Renk seçenekleri:</strong> {', '.join(p['colors'])}</li>")
    if p["code"]:
        parts.append(f"<li><strong>Ürün kodu:</strong> {p['code']}</li>")
    if p["designer"]:
        parts.append(f"<li><strong>Tasarımcı:</strong> {p['designer']}</li>")
    parts.append("</ul>")
    return "".join(parts)


def scrape_doganlar():
    out = []
    groups = [
        # (wanted names, site category, shop category, sku suffix, name format, short desc, kind)
        (DOGANLAR_ROZETLI, 2, "KAPI KOLLARI", "", "{}", "DOĞANLAR KAPI KOLLARI", "rozetli kapı kolu"),
        (DOGANLAR_CEKME, 3, "ÇEKME KOLLAR", "-cekme", "{} Çekme Kol", "DOĞANLAR ÇEKME KOLLAR", "çekme kol"),
    ]
    for wanted, site_cat, shop_cat, suffix, name_fmt, short, kind in groups:
        slugs = doganlar_slugs(site_cat)
        print(f"Doğanlar category {site_cat}: {len(slugs)} products on site")
        for name in wanted:
            slug = DOGANLAR_CEKME_SLUG.get(name) if suffix else None
            slug = slug or doganlar_find_slug(name, slugs)
            if not slug:
                print(f"  ! not found on site: {name}")
                out.append({"source": "doganlar", "missing": True, "name": name, "category": shop_cat})
                continue
            p = doganlar_product(slug)
            sku = fold(name) + suffix
            out.append({
                "source": "doganlar",
                "sku": sku,
                "name": name_fmt.format(tr_title(name)),
                "category": shop_cat,
                "shortDescription": short,
                "description": doganlar_description(p, kind),
                "sourceUrl": p["url"],
                "images": download_images("doganlar", sku, p["images"]),
            })
            print(f"  {name:10} -> {slug:16} {len(p['images'])} img, colors: {', '.join(p['colors'])}")
    return out


# ---------------------------------------------------------------------------
# Umut Kulp  (umutkulp.com.tr - WordPress/WooCommerce, public REST API)
# ---------------------------------------------------------------------------

UMUT = "https://umutkulp.com.tr"


def scrape_umut():
    cats = {c["id"]: c["name"] for c in json.loads(fetch(f"{UMUT}/wp-json/wp/v2/product_cat?per_page=100"))}
    products = []
    for page in range(1, 10):
        batch = json.loads(fetch(f"{UMUT}/wp-json/wp/v2/product?per_page=100&page={page}&_embed"))
        products += batch
        if len(batch) < 100:
            break
    print(f"Umut Kulp: {len(products)} products on site")
    index = {}
    for p in products:
        cat = cats.get(p["product_cat"][0], "") if p["product_cat"] else ""
        index[(cat, html.unescape(p["title"]["rendered"]).strip())] = p

    out = []
    groups = [
        (UMUT_KULP, "Kulplar", "KAPI KULPLARI", "Kulp", "UMUT KULP"),
        (UMUT_DUGME, "Düğmeler", "DÜĞME KULPLAR", "Düğme", "UMUT DÜĞME KULP"),
    ]
    for wanted, site_cat, shop_cat, word, short in groups:
        for code in wanted:
            p = index.get((site_cat, code))
            if not p:
                print(f"  ! not found on site: {code} {word}")
                out.append({"source": "umut", "missing": True, "name": f"{code} {word}", "category": shop_cat})
                continue
            media = p.get("_embedded", {}).get("wp:featuredmedia", [])
            images = [m["source_url"] for m in media if m.get("source_url")]
            sku = f"UMUT-{code}" if word == "Kulp" else f"UMUT-D{code}"
            out.append({
                "source": "umut",
                "sku": sku,
                "name": f"Umut {code} {word}",
                "category": shop_cat,
                "shortDescription": short,
                "description": f"<p>Umut Kulp {code} model mobilya {word.lower()}.</p>",
                "sourceUrl": p["link"],
                "images": download_images("umut", sku, images),
            })
            print(f"  {code:5} {word}: {len(images)} img")
    return out


# ---------------------------------------------------------------------------
# Starax  (starax.com.tr - category tree: urunler?product_cat_hierarchy=...)
# ---------------------------------------------------------------------------

STX = "https://starax.com.tr"
STARAX_TOP = {"01": "MUTFAK SİSTEMLERİ", "02": "GARDIROP SİSTEMLERİ", "03": "BANYO AKSESUARLARI"}
# Code-table column -> Turkish label (None = drop the column)
STARAX_COLUMNS = {
    "Product Code": "Ürün Kodu", "W x D x H (mm)": "G x D x Y (mm)", "C (mm)": "Dolap Genişliği (mm)",
    "Basket": "Sepet", "Weight (kg)": "Ağırlık (kg)", "Box": None, "Volume (m³)": None,
}


def starax_url(hier):
    return f"{STX}/urunler?product_cat_hierarchy={hier}&product_cat_level={hier.count('.') + 2}"


def starax_children(h, hier):
    """Child category links of `hier`, with their display names."""
    kids = {}
    pat = rf'href="{re.escape(STX)}/urunler\?product_cat_hierarchy=({re.escape(hier)}\.\d+)&[^"]*"[^>]*>(.*?)</a>'
    for m in re.finditer(pat, h, re.S):
        name = text_of(m.group(2))
        if name or m.group(1) not in kids:
            kids[m.group(1)] = name or kids.get(m.group(1), "")
    return kids


def starax_product(h, hier, path_names):
    title = text_of(re.search(r'class="products-end__title">(.*?)</h5>', h, re.S).group(1))
    slide_box = re.search(r'swiper-details">(.*?)<!-- Add Arrows -->', h, re.S)
    images = re.findall(r"<img src='([^']+)'", slide_box.group(1)) if slide_box else []
    intro_m = re.search(r'class="products-end__mat"[^>]*>(.*?)</li>', h, re.S)
    intro = re.sub(r"\s*\n\s*", " ", text_of(intro_m.group(1))) if intro_m else ""
    drawings = re.findall(r"<img src='([^']+)' class=\"agenda__technical\"", h)
    colors = [(c, html.unescape(n)) for c, n in
              re.findall(r'data-color-code="([^"]*)" alt="([^"]*)"', h)]

    # Code tables: one per colour, identical apart from the code suffix -
    # keep the first and show codes without the colour suffix.
    rows, header = [], []
    agenda = h[h.find("agenda__group1"):h.find("agenda__group2")]
    tables = re.findall(r"<table.*?</table>", agenda, re.S)
    if tables:
        for tr in re.findall(r"<tr.*?</tr>", tables[0], re.S):
            cells = [text_of(c) for c in
                     re.findall(r'<div class="agenda__(?:body-)?col"[^>]*>(.*?)</div>', tr, re.S)]
            if not cells:
                continue
            if not header:
                header = cells
            else:
                rows.append(cells)
        # Keep what a customer cares about; box count / volume are logistics.
        keep = [i for i, c in enumerate(header) if STARAX_COLUMNS.get(c, "") is not None]
        header = [STARAX_COLUMNS.get(header[i], header[i]) for i in keep]
        rows = [[r[i] for i in keep if i < len(r)] for r in rows]
    suffixes = {f"-{c}" for c, _ in colors if c}
    for r in rows:
        for s in suffixes:
            if r[0].endswith(s):
                r[0] = r[0][: -len(s)]

    desc = []
    if intro:
        desc.append(f"<p>{html.escape(intro)}</p>")
    if colors:
        names = ", ".join(f"{n} (-{c})" if c else n for c, n in colors)
        desc.append(f"<p><strong>Renk seçenekleri:</strong> {html.escape(names)}</p>")
    if rows:
        head = "".join(f"<th>{html.escape(c)}</th>" for c in header)
        body = "".join("<tr>" + "".join(f"<td>{html.escape(c)}</td>" for c in r) + "</tr>" for r in rows)
        desc.append(f"<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>")
        if colors:
            desc.append("<p><em>Ürün kodunun sonuna renk kodu eklenir (ör. "
                        f"{html.escape(rows[0][0])}-{html.escape(colors[0][0])}).</em></p>")
    description = "".join(desc)
    if len(description) > 5000:  # API limit; drop the table rather than cut HTML mid-tag
        description = "".join(desc[:2]) + "<p>Ölçü ve kod tablosu için bize ulaşın.</p>"

    sku = "STX-" + hier.replace(".", "")
    # path_names = [top, group, ..., product]; some products sit right under top.
    group = path_names[1] if len(path_names) > 2 else None
    return {
        "source": "starax",
        "sku": sku,
        "name": f"Starax {title}",
        "category": group or path_names[0],
        "parentCategory": path_names[0] if group else None,
        "shortDescription": f"STARAX {group or path_names[0]}",
        "description": description,
        "sourceUrl": starax_url(hier),
        "codes": [r[0] for r in rows],
        "images": download_images("starax", sku, images + drawings),
    }


def scrape_starax():
    out, seen = [], set()

    def walk(hier, path_names):
        if hier in seen:
            return
        seen.add(hier)
        h = fetch(starax_url(hier))
        if 'class="products-end__title"' in h:
            p = starax_product(h, hier, path_names)
            out.append(p)
            print(f"  {' / '.join(path_names)}: {len(p['images'])} img, {len(p['codes'])} codes")
            return
        for kid, name in starax_children(h, hier).items():
            walk(kid, path_names + [name])

    for top, name in STARAX_TOP.items():
        walk(top, [name])
    print(f"Starax: {len(out)} products")
    return out


# ---------------------------------------------------------------------------

def main():
    which = sys.argv[1:] or ["doganlar", "umut", "starax"]
    DATA.mkdir(exist_ok=True)
    catalog_file = DATA / "catalog.json"
    catalog = json.loads(catalog_file.read_text()) if catalog_file.exists() else []
    catalog = [p for p in catalog if p["source"] not in which]
    for src in which:
        catalog += {"doganlar": scrape_doganlar, "umut": scrape_umut, "starax": scrape_starax}[src]()
    catalog_file.write_text(json.dumps(catalog, ensure_ascii=False, indent=2))
    ok = [p for p in catalog if not p.get("missing")]
    print(f"\nWrote {catalog_file}: {len(ok)} products, {len(catalog) - len(ok)} not found on supplier sites")


if __name__ == "__main__":
    main()
