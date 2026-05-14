export const ADMIN_ROLES = ['super_admin', 'content_admin', 'viewer_admin', 'merchant_admin'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSION_KEYS = [
  'dashboard:view',
  'users:view',
  'users:delete',
  'posts:view',
  'posts:review',
  'posts:delete',
  'comments:view',
  'comments:review',
  'comments:delete',
  'categories:view',
  'categories:create',
  'categories:update',
  'categories:delete',
  'articles:view',
  'articles:create',
  'articles:update',
  'articles:delete',
  'products:view',
  'products:create',
  'products:update',
  'products:delete',
  'settings:view',
  'settings:update',
  'audit_logs:view',
  'admin_users:view',
  'admin_users:create',
  'admin_users:update_role',
  'admin_users:update_status',
  'admin_users:reset_password',
  'orders:view',
  'orders:update_status',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSION_KEYS)[number];

const allPermissions = [...ADMIN_PERMISSION_KEYS];

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: allPermissions,
  content_admin: [
    'dashboard:view',
    'posts:view',
    'posts:review',
    'comments:view',
    'comments:review',
    'categories:view',
    'categories:create',
    'categories:update',
    'articles:view',
    'articles:create',
    'articles:update',
    'products:view',
    'audit_logs:view',
  ],
  viewer_admin: [
    'dashboard:view',
    'users:view',
    'posts:view',
    'comments:view',
    'categories:view',
    'articles:view',
    'products:view',
    'settings:view',
    'audit_logs:view',
    'admin_users:view',
  ],
  merchant_admin: [
    'products:view',
    'products:create',
    'products:update',
    'products:delete',
    'orders:view',
    'orders:update_status',
  ],
};

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

export function normalizeAdminRole(value?: string | null): AdminRole {
  if (value && isAdminRole(value)) {
    return value;
  }
  return 'content_admin';
}

export function getRoleLabel(role: string) {
  const normalized = normalizeAdminRole(role);
  if (normalized === 'super_admin') {
    return '超级管理员';
  }
  if (normalized === 'viewer_admin') {
    return '只读管理员';
  }
  if (normalized === 'merchant_admin') {
    return '商家账号';
  }
  return '内容管理员';
}

export function getAdminPermissions(role: string) {
  const normalized = normalizeAdminRole(role);
  return ROLE_PERMISSIONS[normalized];
}

export function hasAdminPermission(role: string, permission: AdminPermission) {
  return getAdminPermissions(role).includes(permission);
}
