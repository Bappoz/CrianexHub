import { Router } from 'express';
import { validateJWT } from '../middleware/validate-jwt.js';
import { requirePermission } from '../middleware/require-permission.js';
import type { ValidatedAuthContext } from '../middleware/validate-jwt.js';
import {
  listNotifications,
  countUnread,
  isNotificationStatus,
  updateNotificationStatus,
} from './notifications.service.js';
import { listActiveTemplates } from '../notification-templates/notification-templates.service.js';
import { getNotificationEventType } from '../notification-templates/notification-event-types.js';

const notificationsRouter = Router();
// Visibilidade (owner vê tudo; member só o que é global ou endereçado a ele) é
// aplicada dentro do service — aqui só exigimos a permissão de visualização do
// módulo, permitindo que membros com acesso concedido também usem a central.
const viewGuard = [validateJWT, requirePermission('notifications', 'v')];

// Resolve a cor de cada notificação a partir do template ativo do seu tipo_evento
// (personalização configurada em /admin/notification-templates); cai para a cor
// sugerida do catálogo de tipos e, por fim, para o roxo padrão do sistema quando o
// tipo não está no catálogo (ex.: dados legados). Assim, mudar a cor de um template
// reflete automaticamente nas notificações já existentes daquele tipo (F08 → F07).
async function resolveNotificationColors(tipos: string[]): Promise<Map<string, string>> {
  const uniqueTipos = [...new Set(tipos)];
  const colorByTipo = new Map<string, string>();
  if (uniqueTipos.length === 0) return colorByTipo;

  const activeTemplates = await listActiveTemplates();
  const templateColorByTipo = new Map(activeTemplates.map((t) => [t.tipo_evento, t.color]));

  for (const tipo of uniqueTipos) {
    const color =
      templateColorByTipo.get(tipo) ?? getNotificationEventType(tipo)?.color ?? '#7f3fe5';
    colorByTipo.set(tipo, color);
  }
  return colorByTipo;
}

// GET /api/admin/notifications?status=unread|read — lista notificações ordenadas por
// created_at DESC + contador de não lidas. (F07 · CP9 · RNF03)
notificationsRouter.get('/', ...viewGuard, async (req, res) => {
  const rawStatus = req.query['status'];
  const viewer = (res.locals as { auth: ValidatedAuthContext }).auth.user;

  if (rawStatus !== undefined && !isNotificationStatus(rawStatus)) {
    res.status(400).json({ message: "Parâmetro 'status' deve ser 'unread' ou 'read'." });
    return;
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(viewer, isNotificationStatus(rawStatus) ? rawStatus : undefined),
      countUnread(viewer),
    ]);
    const colorByTipo = await resolveNotificationColors(notifications.map((n) => n.tipo));
    const enriched = notifications.map((n) => ({ ...n, color: colorByTipo.get(n.tipo) }));
    res.status(200).json({ notifications: enriched, unreadCount });
  } catch (err) {
    console.error('[notifications] list error:', err);
    res.status(500).json({ message: 'Falha ao listar notificações.' });
  }
});

// PATCH /api/admin/notifications/:id — marca uma notificação como lida (status).
// Idempotente: reenviar o mesmo status numa notificação já lida retorna 200. (F07 · #188)
notificationsRouter.patch('/:id', ...viewGuard, async (req, res) => {
  const id = typeof req.params['id'] === 'string' ? req.params['id'].trim() : '';
  const status = req.body?.['status'];
  const viewer = (res.locals as { auth: ValidatedAuthContext }).auth.user;

  if (!id) {
    res.status(400).json({ message: 'ID da notificação é obrigatório.' });
    return;
  }
  if (!isNotificationStatus(status)) {
    res.status(400).json({ message: "Campo 'status' deve ser 'unread' ou 'read'." });
    return;
  }

  try {
    const updated = await updateNotificationStatus(id, status, viewer);
    if (!updated) {
      res.status(404).json({ message: 'Notificação não encontrada.' });
      return;
    }
    res.status(200).json(updated);
  } catch (err) {
    console.error('[notifications] update status error:', err);
    res.status(500).json({ message: 'Falha ao atualizar notificação.' });
  }
});

export { notificationsRouter };
