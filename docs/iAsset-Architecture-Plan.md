# iAsset — IT Asset Management System
## Architecture, Database Design & Development Plan (v1.0)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                          │
│   Next.js (React) — Web App (Desktop-first, responsive)       │
└───────────────────────────┬────────────────────────────────┘
                              │ HTTPS / REST (JSON)
┌───────────────────────────▼────────────────────────────────┐
│                      APPLICATION LAYER                        │
│   Next.js API Routes (or standalone Node/Express API)         │
│   - Auth Middleware (session/JWT)                              │
│   - RBAC / Permission Middleware                                │
│   - Business Logic Services (per module)                        │
│   - Validation Layer (zod/yup)                                  │
│   - Audit Logging Middleware (intercepts writes)                 │
└───────┬───────────────┬───────────────┬────────────────────┘
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼───────────┐
│  PostgreSQL   │ │ File Storage │ │ Notification      │
│  (Primary DB) │ │ (local/S3)   │ │ Queue (in-app,     │
│               │ │ photos/docs  │ │ email-ready later) │
└───────────────┘ └─────────────┘ └────────────────────┘
```

### 1.2 Architectural Principles

- **Modular monolith** to start — organized by domain module (assets, rooms, transfers, maintenance, audits), not microservices. Easier to develop/deploy on a single internal server; can be split later if needed.
- **Service layer pattern** — API routes/controllers stay thin; all business rules (e.g., "one pending transfer per asset") live in a service layer that's reusable and testable.
- **Immutable history tables** — `asset_transfers`, `audit_logs`, `maintenance_records` are insert-only/append-only; no hard deletes.
- **Soft delete** everywhere for master data (`deleted_at` column) — never hard delete assets, rooms, users.
- **Every mutation goes through the service layer**, which writes to `audit_logs` automatically — this is centralized, not scattered per-controller, so it can't be forgotten.
- **Extensibility hooks**: notification dispatch is behind an interface (`NotificationChannel`) so email/WhatsApp/Telegram can be added later without touching business logic. Auth is behind an `AuthProvider` interface so LDAP/Entra ID/SSO can be swapped in later.

---

## 2. Recommended Tech Stack

| Layer | Choice | Reasoning |
|---|---|---|
| Frontend | **Next.js 14+ (App Router) + React + TypeScript** | SSR for dashboard performance, file-based routing fits the nav structure, one codebase for FE+API |
| Backend | **Next.js API Routes / Route Handlers** (same app) | Avoids managing two deployments; can extract to separate Express/Nest service later if scale demands |
| Database | **PostgreSQL 16** | Relational integrity is critical (FKs everywhere), strong JSON support for flexible fields (e.g., custom attributes) |
| ORM | **Prisma** | Type-safe queries, migrations, great fit for TS + Next.js, generates ERD-adjacent schema file as single source of truth |
| Styling | **Tailwind CSS + shadcn/ui** | Enterprise-clean components fast, fully customizable, no heavy design system lock-in |
| Auth | **NextAuth.js (Auth.js) with credentials provider + JWT session**, architected to add LDAP/Entra ID provider later | Secure, well-supported, provider pattern matches your "future features" requirement |
| File storage | **Local disk volume (Docker volume) initially**, abstracted behind a storage interface for S3/MinIO later | Keeps deployment simple for an internal server |
| QR Codes | **`qrcode` (server-side generation) + `@zxing/browser` or `html5-qrcode` (client-side scanning)** | Well-maintained, works offline-capable in browser |
| Charts | **Recharts** | Clean, composable, matches enterprise dashboard look |
| Validation | **Zod** | Shared schema between frontend forms and backend validation |
| Background jobs (warranty checks, notifications) | **node-cron** initially → BullMQ + Redis if volume grows | Start simple, upgrade path is clear |
| Deployment | **Docker Compose** (app + postgres + optional redis) | Matches your requirement for easy internal server deployment |
| Testing | **Vitest (unit) + Playwright (E2E on critical flows: transfer approval, audit)** | Transfer/approval logic is business-critical — needs regression protection every phase |

---

## 3. Database ERD (Entity Relationships)

```
departments ──┐
              │
users ────────┼────< user_roles >──── roles ────< role_permissions >──── permissions
   │          │
   │          └──< rooms (department_id)
   │
   ├──< room_pics (user_id, room_id, is_backup) >── rooms
   │
   ├──< assets (assigned_user_id) 
   │
vendors ──< assets (vendor_id)
asset_categories ──< asset_models ──< assets
asset_categories ──< approval_workflow_rules

rooms ──< assets (current_room_id)
rooms ──< room_pics

assets ──< asset_assignments (history: employee/room/dept/storage)
assets ──< asset_transfers ──< transfer_approvals
assets ──< maintenance_records
assets ──< attachments
assets ──< audit_items >── audit_sessions

users ──< notifications
users ──< audit_logs (actor)
(any entity) ──< audit_logs (polymorphic: entity_type + entity_id)
```

**Key relationship rules enforced at DB level:**
- `assets.current_room_id` and `assets.assigned_user_id` are **independent, nullable** FKs (a server can have a room but no assigned user).
- `asset_transfers` has `from_room_id`, `to_room_id`, `requested_by`, `current_approver_id`, `status` — never mutates `assets.current_room_id` directly except via the approved+received transition (enforced in service layer, not just app logic — a DB trigger or check constraint can back this up).
- Partial unique index: only **one `asset_transfers` row per `asset_id`** with `status IN ('draft','pending_approval','approved','in_transit')` — enforces "no asset can have two pending transfers."

---

## 4. Database Tables (Core Schema)

```sql
-- ===== IDENTITY & ACCESS =====
users (
  id, employee_id, name, email, password_hash, department_id,
  phone, avatar_url, is_active, created_at, updated_at, deleted_at
)

roles (id, name, description, created_at)
permissions (id, code, module, description)          -- e.g. 'asset.create', 'transfer.approve'
role_permissions (role_id, permission_id)
user_roles (user_id, role_id)

departments (id, name, code, parent_department_id, manager_id)

-- ===== LOCATIONS =====
buildings (id, name, code, address)
rooms (
  id, room_code, name, building_id, floor, department_id,
  room_type, capacity, status, description, created_at, updated_at, deleted_at
)
room_pics (
  id, room_id, user_id, pic_type ENUM('primary','backup'),
  assigned_at, unassigned_at, is_active
)

-- ===== ASSET CATALOG =====
vendors (id, name, contact_person, phone, email, address)
asset_categories (id, name, code, parent_category_id)
asset_models (id, name, category_id, brand, manufacturer, specs JSONB)

asset_statuses (id, code, label, is_terminal)   -- lookup table (Available, Assigned, In Storage, Under Maintenance, Damaged, Lost, Stolen, Retired, Disposed)
asset_conditions (id, code, label)               -- lookup table (Excellent, Good, Fair, Poor, Damaged)

-- ===== ASSETS =====
assets (
  id, asset_code, name, category_id, model_id, brand, serial_number,
  purchase_date, purchase_price, warranty_start_date, warranty_end_date,
  vendor_id, department_id,
  current_room_id, current_pic_id,        -- denormalized for fast reads, kept in sync by service layer
  assigned_user_id,
  status_id, condition_id,
  qr_code_value, barcode_value, photo_url,
  notes, created_by, created_at, updated_at, deleted_at
)

asset_assignments (                        -- immutable log of WHO/WHERE over time
  id, asset_id, assignment_type ENUM('employee','room','department','storage'),
  user_id, room_id, department_id,
  started_at, ended_at, reason, created_by
)

-- ===== TRANSFER WORKFLOW =====
asset_transfers (
  id, asset_id, from_room_id, to_room_id,
  requested_by, reason, status,
  requested_at, decided_at, received_at, completed_at,
  current_approval_step, cancelled_reason
)

approval_workflow_rules (                    -- configurable per category
  id, category_id, step_order, approver_role_id, approver_type ENUM('room_pic_source','room_pic_dest','role','specific_user')
)

transfer_approvals (
  id, transfer_id, step_order, approver_id, action ENUM('approved','rejected','revision_requested'),
  comment, acted_at
)

-- ===== MAINTENANCE =====
maintenance_records (
  id, asset_id, maintenance_type, vendor_id, technician_name,
  start_date, end_date, problem_description, action_taken, cost,
  warranty_claim BOOLEAN, result, status, notes, created_by, created_at
)

-- ===== AUDIT (STOCK OPNAME) =====
audit_sessions (id, name, scope_description, department_id, room_id, status, started_by, started_at, completed_at)
audit_items (
  id, audit_session_id, asset_id,
  expected_room_id, scanned_room_id, result ENUM('verified','not_found','wrong_location','damaged','missing','extra'),
  scanned_by, scanned_at, notes
)

-- ===== SUPPORTING =====
attachments (id, entity_type, entity_id, file_name, file_url, uploaded_by, uploaded_at)
notifications (id, user_id, type, title, message, is_read, entity_type, entity_id, created_at)
audit_logs (
  id, user_id, action, entity_type, entity_id,
  old_value JSONB, new_value JSONB, ip_address, created_at
)
```

Indexes: FKs on all `*_id` columns, `assets.asset_code` (unique), `assets.serial_number` (unique), `assets(status_id, current_room_id)` composite for dashboard queries, `audit_logs(entity_type, entity_id)` composite, partial unique on `asset_transfers` as noted above.

---

## 5. Roles & Permissions Matrix

Permissions are **granular** (`module.action`), assigned to roles, but roles can be customized per user by adding direct permission overrides later (architecture supports it — `user_permissions` override table can be added in Phase 1 if you want it from day one, or Phase 10).

| Module Action | Super Admin | Asset Admin | IT Manager | IT Support | Room PIC | Dept Manager | Auditor | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| asset.create/edit/delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| asset.view (all) | ✅ | ✅ | ✅ | View assigned | View room | View dept | ✅ | View own |
| room.manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| transfer.create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Request only |
| transfer.approve | ✅ | ✅ | ✅ (per workflow) | ❌ | ✅ (per workflow) | ✅ (per workflow) | ❌ | ❌ |
| transfer.receive-confirm | ✅ | ✅ | ✅ | ✅ | ✅ (dest PIC) | ❌ | ❌ | ❌ |
| maintenance.manage | ✅ | ✅ | ✅ | ✅ | Report only | ❌ | ❌ | ❌ |
| audit.create/run | ✅ | ✅ | ❌ | ❌ | Room audit | ❌ | ✅ | ❌ |
| reports.view | ✅ | ✅ | ✅ | Limited | Room only | Dept only | ✅ | ❌ |
| user/role.manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| audit_logs.view | ✅ | ✅ (read-only) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings.manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 6. Asset Lifecycle (State Machine)

```
Available ──assign──> Assigned ──unassign──> Available
Available/Assigned ──send for repair──> Under Maintenance ──complete──> Available/Assigned (prior state)
Any active state ──report──> Damaged / Lost / Stolen
Damaged ──repair──> Available (via Maintenance completion)
Lost/Stolen/Damaged(unrepairable)/Old ──retire──> Retired
Retired ──dispose──> Disposed (terminal)
```

Rules enforced in service layer:
- Status transitions are **validated against an allowed-transition table** (not free-form) — e.g., you can't go directly from `Disposed` back to `Available`.
- Entering "Under Maintenance" is only possible via a `maintenance_records` creation, and exiting it only via that record's completion — keeps status and maintenance history in sync automatically instead of allowing manual status edits that drift from reality.

---

## 7. Transfer & Approval Workflow (Detailed)

```
1. DRAFT           — requester builds the request
2. PENDING_APPROVAL — submitted; current_approval_step = 1
       │
       ├─ Approver approves step N ──> if more steps: step N+1 (still PENDING_APPROVAL)
       │                              if last step: → APPROVED
       ├─ Approver rejects ──> REJECTED (asset location unchanged, terminal)
       └─ Approver requests revision ──> DRAFT (requester edits & resubmits)

3. APPROVED         — asset "in-flight"; from/to recorded, NOT yet moved physically
4. IN_TRANSIT        — optional physical-movement window (can be skipped for same-building moves)
5. Destination Room PIC confirms receipt ──> RECEIVED
6. System finalizes: assets.current_room_id updated, asset_assignments closed/opened,
   asset_transfers.completed_at set ──> COMPLETED

CANCELLED — requester or admin can cancel from DRAFT/PENDING_APPROVAL only; asset location unchanged
```

**Approval steps are resolved dynamically per transfer** from `approval_workflow_rules` filtered by the asset's category — this is what makes "Monitor: PIC→PIC" vs "Server: IT Manager→Infra Manager→PIC" configurable without code changes.

---

## 8. Main Pages / Screens

```
/login
/dashboard

/assets                     (list, search, filter, sort)
/assets/new
/assets/:id                 (detail: info, history, maintenance, transfers, audit results)
/assets/:id/edit
/assets/import
/assets/categories
/assets/models
/assets/vendors

/locations/buildings
/locations/rooms
/locations/rooms/:id        (room detail: PICs + current assets)
/locations/room-pics

/transfers                  (my requests)
/transfers/new
/transfers/:id
/transfers/approvals        (pending my approval)
/transfers/history

/maintenance
/maintenance/new
/maintenance/:id

/audits
/audits/new
/audits/:id/scan            (mobile-friendly scan UI)
/audits/:id/report

/reports/:reportType

/notifications

/admin/users
/admin/roles
/admin/permissions
/admin/approval-workflows
/admin/settings
/admin/audit-logs

/scan/:assetCode            (public-ish QR landing → redirects to login if not authenticated, else asset detail)
```

---

## 9. API Structure (REST)

```
POST   /api/auth/login | logout | session

GET    /api/assets          ?search=&status=&category=&room=&page=
POST   /api/assets
GET    /api/assets/:id
PATCH  /api/assets/:id
DELETE /api/assets/:id                (soft delete)
POST   /api/assets/import
GET    /api/assets/export
GET    /api/assets/:id/history
GET    /api/assets/:id/qrcode

GET|POST      /api/rooms
GET|PATCH     /api/rooms/:id
GET|POST      /api/rooms/:id/pics

GET|POST      /api/transfers
GET           /api/transfers/:id
POST          /api/transfers/:id/approve | reject | request-revision
POST          /api/transfers/:id/confirm-receipt
POST          /api/transfers/:id/cancel

GET|POST      /api/maintenance
PATCH         /api/maintenance/:id/complete

GET|POST      /api/audits
POST          /api/audits/:id/scan
GET           /api/audits/:id/report

GET           /api/reports/:type       ?format=xlsx|csv|pdf&from=&to=

GET           /api/notifications
PATCH         /api/notifications/:id/read

GET|POST      /api/admin/users | roles | permissions | approval-workflows
GET           /api/admin/audit-logs
```

All endpoints sit behind auth middleware + permission-check middleware (`requirePermission('asset.create')`), and all mutating endpoints pass through the audit-logging wrapper automatically.

---

## 10. Project Folder Structure

```
iasset/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── assets/
│   │   │   ├── locations/
│   │   │   ├── transfers/
│   │   │   ├── maintenance/
│   │   │   ├── audits/
│   │   │   ├── reports/
│   │   │   └── admin/
│   │   └── api/
│   │       ├── assets/
│   │       ├── rooms/
│   │       ├── transfers/
│   │       ├── maintenance/
│   │       ├── audits/
│   │       ├── reports/
│   │       └── admin/
│   ├── components/
│   │   ├── ui/                     # shadcn primitives
│   │   ├── assets/
│   │   ├── transfers/
│   │   └── shared/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── permissions.ts
│   │   └── qrcode.ts
│   ├── services/                   # business logic layer
│   │   ├── asset.service.ts
│   │   ├── room.service.ts
│   │   ├── transfer.service.ts
│   │   ├── maintenance.service.ts
│   │   ├── audit.service.ts
│   │   └── notification.service.ts
│   ├── middleware/
│   │   ├── withAuth.ts
│   │   ├── withPermission.ts
│   │   └── withAuditLog.ts
│   ├── validators/                 # zod schemas
│   └── types/
├── public/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── package.json
└── README.md
```

---

## 11. Development Phases (Confirmed Plan)

| Phase | Scope | Key Deliverables |
|---|---|---|
| **1** | Foundation: Auth + Users/Roles/Permissions | Next.js+Prisma+Postgres+Docker scaffold, login, RBAC middleware, seed data, admin user CRUD |
| 2 | Asset Management core | Asset CRUD, categories/models/vendors, search/filter/sort, import/export |
| 3 | Room & Room PIC Management | Buildings/Rooms CRUD, Room PIC assignment, room asset visibility |
| 4 | Asset Assignment | Employee/Room/Department/Storage assignment logic, `asset_assignments` history |
| 5 | Transfer + Approval Workflow | Transfer request flow, configurable approval rules, receive-confirmation |
| 6 | QR Code | Generation, print labels, scan-to-view, public scan landing page |
| 7 | Maintenance | Maintenance CRUD, auto status sync with asset |
| 8 | Asset Audit | Audit sessions, scan-based verification, audit report |
| 9 | Reports | All report types, export to Excel/CSV/PDF |
| 10 | Notifications + Audit Trail polish | In-app notifications for all triggers, audit log viewer, email-ready architecture |

Each phase ends with a working, deployable state — nothing in an earlier phase breaks in later ones (enforced via the E2E test suite growing each phase).

---

## 12. Open Questions Before Phase 1 Starts

A few things worth deciding now to avoid rework later:

1. **Auth method**: local email/password only for now, or do you want the LDAP/Entra ID hook stubbed in from Phase 1 (even if unused)?
2. **Multi-department scale**: roughly how many rooms/assets/users at launch? (affects whether we need pagination/indexing tuning early vs later)
3. **File storage**: fine with local Docker volume for photos/docs for now, or do you already have an S3/MinIO target?
4. **Approval workflow default**: should I hard-code the 3 example workflows from your doc (Monitor/Laptop/Server) as seed data, or leave `approval_workflow_rules` empty for you to configure via UI in Phase 5?

You don't need to answer all of these now — sensible defaults will be used and can be changed later — but flagging them so nothing silently gets locked in wrong.
