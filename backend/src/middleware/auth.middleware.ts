import type { CookieOptions, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

/** Nombre de la cookie httpOnly donde viaja el JWT del admin. */
export const ADMIN_COOKIE = 'santiago_admin_token';

interface AdminTokenPayload {
  sub: string;
  username: string;
}

/**
 * Opciones de la cookie de sesion.
 * En produccion (Vercel -> Railway son dominios distintos) hace falta
 * SameSite=None + Secure para que el navegador la envie en cross-site.
 */
export function adminCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 2,
  };
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Protege las rutas del panel: exige un JWT valido en la cookie.
 * Deja los datos del admin en `req.admin` para los controladores.
 *
 * Genericos abiertos para poder encadenarlo con controladores que tipan
 * sus propios params y body.
 */
export const requireAdmin: RequestHandler<any, any, any, any> = (req, _res, next) => {
  const token = req.cookies?.[ADMIN_COOKIE];

  if (!token) {
    next(HttpError.unauthorized('Debes iniciar sesion'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;
    req.admin = { id: payload.sub, username: payload.username };
    next();
  } catch {
    next(HttpError.unauthorized('Sesion invalida o expirada'));
  }
};
