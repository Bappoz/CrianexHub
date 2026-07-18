import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { hashIp } from './leads.service.js';
import { contactController, contactTokenController } from './leads.controller.js';
import { extractIp } from '../lib/extract-ip.js';

const RAW_WINDOW = Number(process.env['RATE_LIMIT_WINDOW_MS']);
const RAW_MAX = Number(process.env['RATE_LIMIT_MAX']);

const windowMs = Number.isFinite(RAW_WINDOW) && RAW_WINDOW > 0 ? RAW_WINDOW : 600_000;
const max = Number.isFinite(RAW_MAX) && RAW_MAX > 0 ? RAW_MAX : 5;

const contactRateLimit = rateLimit({
  windowMs,
  max,
  keyGenerator: (req) => hashIp(extractIp(req)),
  handler: (_req, res) => {
    const minutes = Math.ceil(windowMs / 60_000);
    res.status(429).json({
      error: `Muitas tentativas. Tente novamente em ${minutes} minutos.`,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Emissão de token é barata e o usuário pode recarregar o formulário; o limite é
// mais folgado que o de envio, mas ainda barra minting em massa por um mesmo IP.
const tokenRateLimit = rateLimit({
  windowMs,
  max: Math.max(max * 6, 30),
  keyGenerator: (req) => hashIp(extractIp(req)),
  handler: (_req, res) => res.status(429).json({ error: 'Muitas solicitações.' }),
  standardHeaders: true,
  legacyHeaders: false,
});

const leadsRouter = Router();

leadsRouter.get('/contact/token', tokenRateLimit, contactTokenController);
leadsRouter.post('/contact', contactRateLimit, contactController);

export default leadsRouter;
