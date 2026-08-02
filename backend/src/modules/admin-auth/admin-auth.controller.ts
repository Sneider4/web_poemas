import type { Request, Response } from 'express';

import { ADMIN_COOKIE, adminCookieOptions, signAdminToken } from '../../middleware/auth.middleware';
import { HttpError } from '../../utils/http-error';
import { adminAuthService } from './admin-auth.service';
import type { CambiarPasswordDto, LoginDto, RecuperarDto } from './admin-auth.schema';

export const adminAuthController = {
  /** POST /api/admin/login */
  async login(req: Request<unknown, unknown, LoginDto>, res: Response) {
    const admin = await adminAuthService.validarCredenciales(req.body);
    const token = signAdminToken({ sub: admin.id, username: admin.username });

    // El token viaja en cookie httpOnly: el JS del navegador no puede leerlo,
    // lo que lo protege de un XSS mucho mejor que guardarlo en localStorage.
    res.cookie(ADMIN_COOKIE, token, adminCookieOptions());
    res.json(admin);
  },

  /** POST /api/admin/logout */
  async logout(_req: Request, res: Response) {
    res.clearCookie(ADMIN_COOKIE, { ...adminCookieOptions(), maxAge: undefined });
    res.status(204).send();
  },

  /** GET /api/admin/me - el guard de Angular lo usa al recargar la pagina */
  async yo(req: Request, res: Response) {
    if (!req.admin) {
      throw HttpError.unauthorized();
    }

    const admin = await adminAuthService.obtenerPorId(req.admin.id);
    res.json(admin);
  },

  /** POST /api/admin/password */
  async cambiarPassword(req: Request<unknown, unknown, CambiarPasswordDto>, res: Response) {
    if (!req.admin) {
      throw HttpError.unauthorized();
    }

    await adminAuthService.cambiarPassword(req.admin.id, req.body);

    // Al cambiar la clave se cierra la sesion para forzar un nuevo ingreso.
    res.clearCookie(ADMIN_COOKIE, { ...adminCookieOptions(), maxAge: undefined });
    res.status(204).send();
  },

  /** POST /api/admin/recovery-code - protegido, devuelve el codigo una vez */
  async generarCodigo(req: Request, res: Response) {
    if (!req.admin) {
      throw HttpError.unauthorized();
    }

    const codigo = await adminAuthService.generarCodigo(req.admin.id);

    // Es la unica vez que este codigo viaja en texto plano.
    res.status(201).json({ codigo });
  },

  /** POST /api/admin/recover - publico, con limite estricto de intentos */
  async recuperar(req: Request<unknown, unknown, RecuperarDto>, res: Response) {
    await adminAuthService.recuperar(req.body);

    // Se cierra cualquier sesion previa: hay que entrar con la nueva clave.
    res.clearCookie(ADMIN_COOKIE, { ...adminCookieOptions(), maxAge: undefined });
    res.status(204).send();
  },
};
