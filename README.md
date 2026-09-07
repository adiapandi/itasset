# iAsset — Phase 1 + Phase 2

Internal IT Asset Management System.

- **Phase 1**: login, role-based permissions, user administration, audit-log foundation
- **Phase 2**: Asset Management — asset catalog (categories, models, vendors), asset CRUD, search/filter, import (CSV/XLSX), export (XLSX)

See `docs/iAsset-Architecture-Plan.md` for the full system design.

## Stack

Next.js 14 (App Router) · TypeScript · Prisma · PostgreSQL · NextAuth ·
Tailwind CSS · papaparse + SheetJS (import/export)

## What's included so far

**Phase 1**
- Credentials-based login (`/login`) with a NextAuth session
- Role-based access control: `roles`, `permissions`, `role_permissions`,
  `user_roles` tables + a `hasPermission()` helper used by both pages and
  API routes
- User administration (`/admin/users`): list, create, role assignment,
  soft-delete (deactivate)
- Audit log foundation (`audit_logs` table + `recordAuditLog()` service) —
  every mutation already writes here, and later phases reuse the same function
- Seed script creating default roles/permissions/departments and one
  Super Admin account

**Phase 2**
- Asset catalog: Categories (`/assets/categories`), Models (`/assets/models`),
  Vendors (`/assets/vendors`) — each with its own manage permission
  (`category.manage`, `model.manage`, `vendor.manage`)
- Assets (`/assets`): list with search + status/category filters, pagination,
  detail page, create form
- Auto-generated asset codes (`AST-<CATEGORY>-000123`), scoped per category
- Import from CSV/XLSX and export to XLSX (`asset.import_export` permission)
- Dashboard now shows live asset counts and recently added assets
- Seed script adds 9 sample categories (Laptop, Desktop, Monitor, Printer,
  Network Device, Server, Mobile Device, UPS, CCTV)

Docker Compose (app + Postgres) for a one-command local environment is
included throughout.

---

## 1. Run it locally (fastest path, no Docker)

Requirements: Node.js 20+, a local PostgreSQL 16 instance.

```bash
cd iasset
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your local Postgres, and generate a
# NEXTAUTH_SECRET with: openssl rand -base64 32

npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

If you already ran Phase 1's `init` migration and are updating an existing
checkout, just run a new migration for the Phase 2 schema changes instead:

```bash
npx prisma migrate dev --name phase2_asset_catalog
npm run prisma:seed   # re-run is safe, it upserts and skips existing rows
```

Visit `http://localhost:3000`, sign in with the seeded Super Admin
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your `.env`, defaults to
`admin@iasset.local` / `ChangeMe123!`) — **change this password's underlying
account once user self-service / password change ships (Phase 2+); for now,
update it directly via `npm run prisma:studio` if needed.**

## 2. Run it with Docker Compose

```bash
cd iasset
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
docker compose -f docker/docker-compose.yml up -d --build

# then, in a separate step, run migrations + seed inside the app container:
docker compose -f docker/docker-compose.yml exec app npx prisma migrate deploy
docker compose -f docker/docker-compose.yml exec app npm run prisma:seed
```

App will be available at `http://localhost:3000`.

---

## 3. Push this project to GitHub

From inside the `iasset/` folder:

```bash
git init
git add .
git commit -m "Phase 1: authentication, roles/permissions, user admin"

# Create an empty repo on GitHub first (via github.com or `gh repo create`),
# then:
git branch -M main
git remote add origin https://github.com/<your-username>/iasset.git
git push -u origin main
```

If you use GitHub CLI (`gh`) instead of the website:

```bash
gh repo create iasset --private --source=. --remote=origin --push
```

**Note:** `.env` is already in `.gitignore` — never commit real secrets.
Only `.env.example` should be tracked.

---

## 4. Develop on your local Ubuntu 24 VM

These steps take a fresh Ubuntu 24.04 VM to a working dev environment.

### 4.1 Install Node.js 20 (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # should print v20.x
```

### 4.2 Install PostgreSQL 16

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

sudo -u postgres psql -c "CREATE USER iasset WITH PASSWORD 'iasset';"
sudo -u postgres psql -c "CREATE DATABASE iasset OWNER iasset;"
```

*(Alternative: skip 4.2 entirely and just run Postgres via the `db` service
in `docker-compose.yml` — install Docker instead, see 4.4.)*

### 4.3 Clone the repo and run it

```bash
sudo apt install -y git
git clone https://github.com/<your-username>/iasset.git
cd iasset
npm install
cp .env.example .env
nano .env   # set DATABASE_URL to postgresql://iasset:iasset@localhost:5432/iasset
            # set NEXTAUTH_SECRET (openssl rand -base64 32)

npx prisma migrate dev --name init
npm run prisma:seed
npm run dev -- -H 0.0.0.0   # -H 0.0.0.0 lets you reach it from the VM host
```

Open `http://<vm-ip>:3000` from your host machine's browser (check the VM's
IP with `ip addr show` inside the VM, and make sure your hypervisor's
network mode — bridged/NAT with port forwarding — actually routes to it).

### 4.4 (Optional) Install Docker on the VM instead

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

Then follow the Docker Compose steps in section 2 above.

### 4.5 Everyday workflow on the VM

```bash
git pull                          # get latest changes
npm install                       # if package.json changed
npx prisma migrate dev            # if schema.prisma changed
npm run dev                       # start dev server

# when you're ready to save work:
git add .
git commit -m "describe your change"
git push
```

---

## 5. What's next

Phase 3 adds Room & Room PIC Management (buildings, rooms, primary/backup
PIC assignment, and room-level asset visibility) on top of this foundation —
the auth, RBAC, and audit-log patterns established in Phase 1, and the
catalog/service-layer patterns from Phase 2, carry through unchanged.
