import type { PageServerLoad } from './$types';
import { getFinanceData, RANGES, type Range } from '$lib/mocks/finance';

type ParentAdmin = {
  role?: string | null;
  permissions?: Record<string, string[]> | null;
};

function canView(admin: ParentAdmin | undefined): boolean {
  if (!admin) return false;
  if (admin.role === 'owner') return true;
  const p = admin.permissions?.finance;
  return Array.isArray(p) && p.includes('v');
}

export const load: PageServerLoad = async ({ url, parent }) => {
  const { adminUser } = await parent();

  if (!canView(adminUser)) {
    return { forbidden: true as const };
  }

  const raw = url.searchParams.get('range');
  const range: Range = RANGES.some((r) => r.id === raw) ? (raw as Range) : '30d';

  return { forbidden: false as const, finance: getFinanceData(range) };
};
