import type { PageServerLoad } from './$types';
import { getAuditData } from '$lib/mocks/audit';

type ParentAdmin = {
  role?: string | null;
  permissions?: Record<string, string[]> | null;
};

function canView(admin: ParentAdmin | undefined): boolean {
  if (!admin) return false;
  if (admin.role === 'owner') return true;
  const p = admin.permissions?.auditLogs;
  return Array.isArray(p) && p.includes('v');
}

export const load: PageServerLoad = async ({ parent }) => {
  const { adminUser } = await parent();

  if (!canView(adminUser)) {
    return { forbidden: true as const };
  }

  return { forbidden: false as const, ...getAuditData() };
};
