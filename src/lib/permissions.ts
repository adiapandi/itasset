/**
 * Central registry of permission codes.
 * Later phases add more (transfer.*, maintenance.*, audit.*, report.*)
 * but the pattern (module.action) and the way they're checked stays the same.
 */
export const PERMISSIONS = {
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_EDIT: "user.edit",
  USER_DELETE: "user.delete",

  ROLE_VIEW: "role.view",
  ROLE_MANAGE: "role.manage",

  AUDIT_LOG_VIEW: "audit_log.view",

  SETTINGS_MANAGE: "settings.manage",

  ASSET_VIEW: "asset.view",           // full visibility across all assets
  ASSET_VIEW_OWN: "asset.view_own",   // only assets assigned to the current user
  ASSET_CREATE: "asset.create",
  ASSET_EDIT: "asset.edit",
  ASSET_DELETE: "asset.delete",
  ASSET_IMPORT_EXPORT: "asset.import_export",
  ASSET_ASSIGN: "asset.assign",       // assign/unassign an asset to/from an employee

  CATEGORY_MANAGE: "category.manage",
  MODEL_MANAGE: "model.manage",
  VENDOR_MANAGE: "vendor.manage",

  // Phase 3
  ROOM_VIEW: "room.view",
  ROOM_MANAGE: "room.manage",           // create/edit/delete buildings & rooms
  ROOM_PIC_MANAGE: "room_pic.manage",   // assign/unassign primary & backup PICs
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Default system roles and the permissions they hold at install time.
 * Admins can adjust role→permission mappings later via /admin/roles (Phase 10+),
 * this is just the seed baseline described in the roles matrix.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  "Super Admin": Object.values(PERMISSIONS),
  "Asset Administrator": [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_EDIT,
    PERMISSIONS.ASSET_DELETE,
    PERMISSIONS.ASSET_IMPORT_EXPORT,
    PERMISSIONS.ASSET_ASSIGN,
    PERMISSIONS.CATEGORY_MANAGE,
    PERMISSIONS.MODEL_MANAGE,
    PERMISSIONS.VENDOR_MANAGE,
    PERMISSIONS.ROOM_VIEW,
    PERMISSIONS.ROOM_MANAGE,
    PERMISSIONS.ROOM_PIC_MANAGE,
  ],
  "IT Manager": [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_ASSIGN,
    PERMISSIONS.ROOM_VIEW,
  ],
  "IT Support": [
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_EDIT,
    PERMISSIONS.ASSET_ASSIGN,
    PERMISSIONS.ROOM_VIEW,
  ],
  "Room PIC": [PERMISSIONS.ASSET_VIEW, PERMISSIONS.ROOM_VIEW],
  "Department Manager": [PERMISSIONS.ASSET_VIEW, PERMISSIONS.ROOM_VIEW],
  Auditor: [PERMISSIONS.AUDIT_LOG_VIEW, PERMISSIONS.ASSET_VIEW, PERMISSIONS.ROOM_VIEW],
  Employee: [PERMISSIONS.ASSET_VIEW_OWN],
};
