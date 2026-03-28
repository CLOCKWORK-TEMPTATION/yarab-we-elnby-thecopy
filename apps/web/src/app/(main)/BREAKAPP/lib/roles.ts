/**
 * تعريف الأدوار والصلاحيات — Role-Based Access Control
 *
 * @description
 * يحدد الأدوار المتاحة والمسارات المسموح بها لكل دور
 * لضمان عدم وصول المستخدمين لصفحات غير مصرح لهم بها
 *
 * السبب: حماية الصفحات الحساسة (مثل لوحة المخرج)
 * وتوجيه كل مستخدم للصفحات المناسبة لدوره
 */

/** الأدوار المتاحة في التطبيق */
export type UserRole = 'director' | 'crew' | 'runner' | 'admin';

/** تعريف الصلاحيات لكل دور */
export const ROLE_PERMISSIONS: Record<UserRole, {
  label: string;
  allowedPaths: string[];
  defaultRedirect: string;
}> = {
  director: {
    label: 'المخرج',
    allowedPaths: [
      '/BREAKAPP/dashboard',
      '/BREAKAPP/director',
      '/BREAKAPP/crew/menu',
      '/BREAKAPP/runner/track',
    ],
    defaultRedirect: '/BREAKAPP/dashboard',
  },
  crew: {
    label: 'عضو الطاقم',
    allowedPaths: [
      '/BREAKAPP/dashboard',
      '/BREAKAPP/crew/menu',
    ],
    defaultRedirect: '/BREAKAPP/dashboard',
  },
  runner: {
    label: 'عامل التوصيل',
    allowedPaths: [
      '/BREAKAPP/dashboard',
      '/BREAKAPP/runner/track',
    ],
    defaultRedirect: '/BREAKAPP/dashboard',
  },
  admin: {
    label: 'المدير',
    allowedPaths: [
      '/BREAKAPP/dashboard',
      '/BREAKAPP/director',
      '/BREAKAPP/crew/menu',
      '/BREAKAPP/runner/track',
    ],
    defaultRedirect: '/BREAKAPP/dashboard',
  },
};

/**
 * التحقق من صلاحية الوصول لمسار معين
 *
 * @param role - دور المستخدم
 * @param path - المسار المطلوب
 * @returns هل المستخدم مصرح له بالوصول
 */
export function canAccessPath(role: UserRole, path: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  return permissions.allowedPaths.some((allowed) => path.startsWith(allowed));
}

/**
 * الحصول على المسار الافتراضي للدور
 *
 * @param role - دور المستخدم
 * @returns المسار الافتراضي
 */
export function getDefaultRedirect(role: UserRole): string {
  return ROLE_PERMISSIONS[role]?.defaultRedirect || '/BREAKAPP/dashboard';
}

/**
 * الحصول على تسمية الدور بالعربية
 *
 * @param role - دور المستخدم
 * @returns تسمية الدور
 */
export function getRoleLabel(role: string): string {
  return ROLE_PERMISSIONS[role as UserRole]?.label || role;
}

/**
 * التحقق من أن الدور صالح
 *
 * @param role - الدور المطلوب التحقق منه
 * @returns هل الدور صالح
 */
export function isValidRole(role: string): role is UserRole {
  return role in ROLE_PERMISSIONS;
}
