import { redirect } from '@sveltejs/kit';
import { notifyFetch } from '$lib/api/notify';
import type { PageServerLoad } from './$types';
import { NOTIFICATION_EVENT_TYPES } from '$lib/constants/notification-types';

export type NotificationTemplate = {
  id: string;
  tipo_evento: string;
  nome: string;
  conteudo: string;
  color: string;
  is_default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

// O serviço notify devolve `color` anulável; a UI usa uma cor padrão como fallback.
type NotifyTemplate = Omit<NotificationTemplate, 'color'> & { color: string | null };

export const load: PageServerLoad = async ({ cookies, locals }) => {
  if (!locals.adminUser) throw redirect(303, '/admin/login');

  const token = cookies.get('crianex_admin_access_token');
  if (!token) throw redirect(303, '/admin/login');

  try {
    const templates = await notifyFetch<NotifyTemplate[]>('/templates', { token });
    return {
      templates: (templates ?? []).map((t) => ({ ...t, color: t.color ?? '#6b7280' })),
      // Catálogo de tipos de evento vem do espelho no frontend (não precisa de rede).
      eventTypes: NOTIFICATION_EVENT_TYPES,
    };
  } catch (err) {
    const apiError = err as { status?: number; message?: string };
    if (apiError.status === 401) throw redirect(303, '/admin/login');
    if (apiError.status === 403) return { templates: [], eventTypes: [], forbidden: true };
    return {
      templates: [],
      eventTypes: [],
      error: apiError.message || 'Erro ao carregar templates de notificação.',
    };
  }
};
