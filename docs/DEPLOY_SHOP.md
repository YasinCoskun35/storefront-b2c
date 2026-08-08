# Deploying the Shop (Catalog + WhatsApp mode)

This is a practical checklist for putting the storefront live for a single shop.
In this mode the site is a **browsable catalog with prices** and customers get in
touch via **WhatsApp** — online ordering/checkout is turned off.

## 1. Get a server

Recommended: a small VPS with **2 vCPU / 4 GB RAM / 40 GB SSD**.

- **Best price/performance:** [Hetzner](https://www.hetzner.com/cloud) CX22 / CPX21
  (Frankfurt/Nuremberg — ~30–45 ms to Turkey).
- **Local (TRY invoice, data in Turkey):** Natro / Radore / DeHost VDS.

Install Docker + Docker Compose, point your domain's `A` record at the server IP.

## 2. Configure environment

Create a `.env` file next to `docker-compose.prod.yml`:

```env
# Database
POSTGRES_DB=storefront
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<a-strong-password>

# Auth (use a long random string, 32+ chars)
JWT_SECRET=<a-long-random-secret>
JWT_ISSUER=Storefront.Api
JWT_AUDIENCE=Storefront.Web

# Public site config (baked into the web build)
PUBLIC_API_URL=https://yourdomain.com   # your public domain (nginx proxies /api and /uploads)
ENABLE_ORDERING=false                    # keep false for catalog + WhatsApp mode
```

> `PUBLIC_API_URL` and `ENABLE_ORDERING` are **build-time** values. If you change
> them later you must rebuild the web image (`docker compose ... build web`).

## 3. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The API auto-creates the database schema (including the new `StoreSettings`
table) on first boot. Add TLS with a reverse proxy / certbot on the nginx service
for `https`.

## 4. First-run configuration (in the admin panel)

Log in at `/login` with the seed admin, then **immediately change the password**:

```
Email:    admin@storefront.com
Password: AdminPassword123!   ← change this right away
```

Then, under **Admin → Settings**:

1. **Store Information** — name, contact email/phone, address, social links.
2. **WhatsApp** — enter the number in international format, digits only
   (e.g. `905551112233`). This powers the floating chat button and the
   "Ask about this product" button. Optionally set a default message.
3. **Homepage Slider** — add slides, upload an image for each, and set an
   optional headline / subtext / button. Leave empty to keep the default hero.

Under **Admin → Products / Categories**: create categories, then add products
with prices and images (manual upload).

## 5. Turning ordering on later

If the shop later wants real online ordering/checkout:

1. Set `ENABLE_ORDERING=true` and rebuild the web image.
2. Wire real iyzico merchant keys into the API (payment is already coded).

The cart, checkout, and payment flow are still in the codebase — only hidden.
