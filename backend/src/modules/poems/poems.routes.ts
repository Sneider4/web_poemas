import { Router } from 'express';

import { requireAdmin } from '../../middleware/auth.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { poemsController } from './poems.controller';
import {
  actualizarPoemaSchema,
  crearPoemaSchema,
  listarPoemasQuerySchema,
} from './poems.schema';

/** /api/poems */
export const poemsPublicRoutes = Router();

poemsPublicRoutes.get(
  '/',
  validateQuery(listarPoemasQuerySchema),
  asyncHandler(poemsController.listarPublicos),
);
poemsPublicRoutes.get('/:slug', asyncHandler(poemsController.obtenerPorSlug));

/** /api/admin/poems - todas requieren sesion de admin */
export const poemsAdminRoutes = Router();

poemsAdminRoutes.use(requireAdmin);

poemsAdminRoutes.get('/', asyncHandler(poemsController.listarTodos));
poemsAdminRoutes.get('/:id', asyncHandler(poemsController.obtenerPorId));
poemsAdminRoutes.post(
  '/',
  validateBody(crearPoemaSchema),
  asyncHandler(poemsController.crear),
);
poemsAdminRoutes.put(
  '/:id',
  validateBody(actualizarPoemaSchema),
  asyncHandler(poemsController.actualizar),
);
poemsAdminRoutes.delete('/:id', asyncHandler(poemsController.eliminar));
