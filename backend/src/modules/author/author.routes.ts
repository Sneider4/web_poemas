import { Router } from 'express';

import { requireAdmin } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { authorController } from './author.controller';
import { actualizarAutorSchema } from './author.schema';

/** Rutas publicas: GET /api/author */
export const authorPublicRoutes = Router();

authorPublicRoutes.get('/', asyncHandler(authorController.obtener));

/** Rutas del panel: PUT /api/admin/author */
export const authorAdminRoutes = Router();

authorAdminRoutes.put(
  '/',
  requireAdmin,
  validateBody(actualizarAutorSchema),
  asyncHandler(authorController.actualizar),
);
