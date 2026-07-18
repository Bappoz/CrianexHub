import type { Request, Response } from 'express';
import { validate, sanitizeInput, captureLead } from './leads.service.js';
import { scoreLead } from './lead-scoring.js';
import { issueContactToken, verifyContactToken } from './contact-token.js';

// Emite o token anti-bot invisível consumido no envio do formulário.
export function contactTokenController(_req: Request, res: Response): Response {
  return res.status(200).json({ token: issueContactToken() });
}

export async function contactController(req: Request, res: Response): Promise<Response> {
  const body = req.body as Record<string, unknown>;

  // 1) Honeypot: campo escondido preenchido = bot. Sucesso silencioso, nada persiste.
  if (body['website']) {
    return res.status(200).json({ success: true });
  }

  // 2) Validação de campos: entrada malformada retorna 422 independente de token.
  const input = sanitizeInput(body);
  const errors = validate(input);
  if (errors.length > 0) {
    return res.status(422).json({ errors });
  }

  // 3) Token anti-bot: assinatura/expiração inválida = sessão de formulário inexistente
  //    ou expirada. 403 com código para o frontend renovar o token e reenviar.
  const tokenResult = verifyContactToken(body['token']);
  if (!tokenResult.valid) {
    return res.status(403).json({
      code: 'invalid_token',
      error: 'Sessão do formulário expirada. Recarregue a página e tente novamente.',
    });
  }

  // 4) Score + spam (servidor é a fonte de verdade). O tempo de preenchimento vem
  //    do token e entra como sinal ("rápido demais" = bot).
  const assessment = scoreLead({
    name: input.name,
    email: input.email,
    message: input.message,
    company: input.company,
    role: input.role,
    phone: input.phone,
    productSlug: input.product_interest,
    qualification: input.qualification,
    elapsedMs: tokenResult.elapsedMs,
  });

  try {
    // Spam é persistido em quarentena (fora do board) — nada é descartado, mas o
    // 201 é o mesmo do lead legítimo para não sinalizar ao bot que foi retido.
    await captureLead(input, assessment);
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('[contact] capture_lead failed:', err);
    return res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
  }
}
