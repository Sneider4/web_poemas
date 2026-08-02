import { Router } from 'express';

import { requireAdmin } from '../../middleware/auth.middleware';
import { loginLimiter, recuperacionLimiter } from '../../middleware/rate-limit.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { adminAuthController } from './admin-auth.controller';
import { cambiarPasswordSchema, loginSchema, recuperarSchema } from './admin-auth.schema';

/** /api/admin (login, logout, me, password) */
export const adminAuthRoutes = Router();

adminAuthRoutes.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(adminAuthController.login),
);
adminAuthRoutes.post('/logout', asyncHandler(adminAuthController.logout));
adminAuthRoutes.get('/me', requireAdmin, asyncHandler(adminAuthController.yo));
adminAuthRoutes.post(
  '/password',
  requireAdmin,
  validateBody(cambiarPasswordSchema),
  asyncHandler(adminAuthController.cambiarPassword),
);

// Genera un codigo nuevo: hay que estar dentro del panel.
adminAuthRoutes.post(
  '/recovery-code',
  requireAdmin,
  asyncHandler(adminAuthController.generarCodigo),
);

// Publico a proposito: se usa justamente cuando no se puede entrar.
adminAuthRoutes.post(
  '/recover',
  recuperacionLimiter,
  validateBody(recuperarSchema),
  asyncHandler(adminAuthController.recuperar),
);
