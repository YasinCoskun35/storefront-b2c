#!/usr/bin/env python3
"""Upload data/catalog.json (made by scrape.py) to the shop through its admin API.

Dry run by default - prints what it would create. Add --apply to write.

  python3 import_products.py --api https://harunyapimarket.com --email admin@... [--apply]
  python3 import_products.py --only doganlar umut       # limit to some sources
  python3 import_products.py --price 999                # placeholder price (default: none)

The admin password is read from STORE_ADMIN_PASSWORD, or asked for.

Safe to re-run: products whose SKU (or name, in the same category) already
exists in the shop are skipped, and categories are reused by name.
"""

import argparse
import getpass
import json
import mimetypes
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

DATA = Path(__file__).resolve().parent / "data"


def fold(s):
    s = s.replace("İ", "i").replace("I", "ı").lower()
    return s.translate(str.maketrans("çğıöşü", "cgiosu")).strip()


MAX_IMAGE = 9 * 1024 * 1024  # server limit is 10MB


def shrink_if_needed(img):
    """Downscale an oversized image to 2000px (macOS sips) into data/shrunk/."""
    if img.stat().st_size <= MAX_IMAGE:
        return img
    out = DATA / "shrunk" / img.relative_to(DATA / "images")
    if not out.exists():
        out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["sips", "-Z", "2000", str(img), "--out", str(out)],
                       check=True, capture_output=True)
    return out


class Api:
    def __init__(self, base):
        self.base = base.rstrip("/")
        self.token = None

    def call(self, method, path, body=None, files=None):
        headers = {"Accept": "application/json", "User-Agent": "Mozilla/5.0 (Macintosh) HarunYapiMarket-import"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        data = None
        if files:
            boundary = uuid.uuid4().hex
            name, path_ = files
            ctype = mimetypes.guess_type(path_.name)[0] or "application/octet-stream"
            data = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; "
                    f"filename=\"{path_.name}\"\r\nContent-Type: {ctype}\r\n\r\n").encode()
            data += path_.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
            headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        elif body is not None:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(self.base + path, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                raw = r.read()
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"{method} {path} -> {e.code}: {e.read().decode(errors='replace')[:300]}") from None
        return json.loads(raw) if raw else None

    def login(self, email, password):
        self.token = self.call("POST", "/api/identity/auth/login",
                               {"email": email, "password": password})["accessToken"]


def existing_products(api):
    items, page = [], 1
    while True:
        res = api.call("GET", f"/api/catalog/products?pageSize=100&pageNumber={page}")
        items += res["items"]
        if len(res["items"]) < 100:
            return items
        page += 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:5000")
    ap.add_argument("--email", default="admin@storefront.com")
    ap.add_argument("--only", nargs="*", help="sources to import: doganlar umut starax")
    ap.add_argument("--price", type=float, default=None, help="price to set (default: none)")
    ap.add_argument("--apply", action="store_true", help="actually create (default: dry run)")
    args = ap.parse_args()

    catalog = json.loads((DATA / "catalog.json").read_text())
    catalog = [p for p in catalog if not p.get("missing")]
    if args.only:
        catalog = [p for p in catalog if p["source"] in args.only]

    api = Api(args.api)
    if args.apply:
        password = os.environ.get("STORE_ADMIN_PASSWORD") or getpass.getpass(f"Password for {args.email}: ")
        api.login(args.email, password)

    cats = api.call("GET", "/api/catalog/categories?all=true&includeInactive=true")
    cat_by_key = {(c.get("parentId"), fold(c["name"])): c["id"] for c in cats}
    cat_by_name = {fold(c["name"]): c["id"] for c in cats}

    def category_id(name, parent_name=None):
        parent_id = category_id(parent_name) if parent_name else None
        key = (parent_id, fold(name))
        if key in cat_by_key:
            return cat_by_key[key]
        if not parent_name and fold(name) in cat_by_name:
            return cat_by_name[fold(name)]
        print(f"  + category {parent_name + ' / ' if parent_name else ''}{name}")
        if not args.apply:
            cat_by_key[key] = f"(new:{name})"
            return cat_by_key[key]
        slug = re.sub(r"[^a-z0-9]+", "-", fold(f"{parent_name or ''} {name}")).strip("-")
        res = api.call("POST", "/api/catalog/categories",
                       {"name": name, "slug": slug, "parentId": parent_id, "isActive": True})
        cat_by_key[key] = res["id"]
        return res["id"]

    have = existing_products(api)
    have_skus = {fold(p["sku"]) for p in have}
    have_names = {(p["categoryId"], fold(p["name"])) for p in have}

    created = skipped = failed = 0
    for p in catalog:
        cid = category_id(p["category"], p.get("parentCategory"))
        if fold(p["sku"]) in have_skus or (cid, fold(p["name"])) in have_names:
            skipped += 1
            continue
        images = [DATA / i for i in p["images"] if (DATA / i).exists()]
        print(f"  {'create' if args.apply else 'would create'}: [{p['category']}] {p['name']} "
              f"({p['sku']}, {len(images)} images)")
        if not args.apply:
            created += 1
            continue
        try:
            res = api.call("POST", "/api/catalog/products", {
                "name": p["name"], "sku": p["sku"],
                "description": p["description"], "shortDescription": p["shortDescription"],
                "productType": "Simple", "price": args.price, "compareAtPrice": None,
                "bundlePrice": None, "canBeSoldSeparately": True,
                "stockStatus": "InStock", "quantity": 0,
                "categoryId": cid, "brandId": None,
                "weight": None, "length": None, "width": None, "height": None,
                "isActive": True, "isFeatured": False,
            })
            for i, img in enumerate(images):
                img = shrink_if_needed(img)
                api.call("POST", f"/api/catalog/products/{res['id']}/images"
                         f"?isPrimary={'true' if i == 0 else 'false'}", files=("file", img))
            have_skus.add(fold(p["sku"]))
            created += 1
        except RuntimeError as e:
            print(f"    ! {e}")
            failed += 1

    verb = "created" if args.apply else "to create"
    print(f"\n{created} {verb}, {skipped} already in shop (skipped), {failed} failed")
    if not args.apply:
        print("Dry run - nothing was written. Re-run with --apply to upload.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
