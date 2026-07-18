import { redirect } from '@sveltejs/kit';
import { notifyFetch } from '$lib/api/notify';
import type { Notification } from '$lib/utils/notifications';
import type { PageServerLoad } from './$types';

type NotificationsResponse = { notifications: Notification[]; unreadCount: number };

export const load: PageServerLoad = async ({ cookies, locals }) => {
  if (!locals.adminUser) throw redirect(303, '/admin/login');

  const token = cookies.get('crianex_admin_access_token');
  if (!token) throw redirect(303, '/admin/login');

  try {
    const data = await notifyFetch<NotificationsResponse>('/notifications', { token });
    return { notifications: data.notifications ?? [], unreadCount: data.unreadCount ?? 0 };
  } catch (err) {
    const apiError = err as { status?: number; message?: string };
    if (apiError.status === 401) throw redirect(303, '/admin/login');
    if (apiError.status === 403) return { notifications: [], unreadCount: 0, forbidden: true };
    return {
      notifications: [],
      unreadCount: 0,
      error: apiError.message || 'Erro ao carregar notificações.',
    };
  }
};
