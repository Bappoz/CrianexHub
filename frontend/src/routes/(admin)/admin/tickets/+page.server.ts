import type { PageServerLoad } from './$types';
import { getTicketsData } from '$lib/mocks/tickets';

type ParentAdmin = {
  role?: string | null;
  permissions?: Record<string, string[]> | null;
};

function canView(admin: ParentAdmin | undefined): boolean {
  if (!admin) return false;
  if (admin.role === 'owner') return true;
  const p = admin.permissions?.tickets;
  return Array.isArray(p) && p.includes('v');
}

export const load: PageServerLoad = async ({ parent }) => {
  const { adminUser } = await parent();

  if (!canView(adminUser)) {
    return { forbidden: true as const };
  }

  return { forbidden: false as const, ...getTicketsData() };
};
