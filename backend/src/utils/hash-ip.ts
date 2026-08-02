import { createHash } from 'node:crypto';
import type { Request } from 'express';

import { env } from '../config/env';

/**
 * Identificador anonimo del visitante para deduplicar calificaciones.
 * Guardamos sha256(ip + sal) y nunca la IP en claro: sirve para el
 * constraint unico sin almacenar un dato personal.
 */
export function raterHashFromRequest(req: Request): string {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'desconocida';
  return createHash('sha256').update(`${ip}${env.RATING_SALT}`).digest('hex');
}
