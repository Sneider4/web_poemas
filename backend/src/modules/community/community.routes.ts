import { Router } from 'express';

import { requireAdmin } from '../../middleware/auth.middleware';
import { calificarLimiter, crearPostLimiter } from '../../middleware/rate-limit.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { communityController } from './community.controller';
import {
  crearPostSchema,
  listarPostsQuerySchema,
  moderarPostSchema,
} from './community.schema';

/** /api/community - tablero abierto, sin cuenta de usuario */
export const communityPublicRoutes = Router();

communityPublicRoutes.get(
  '/',
  validateQuery(listarPostsQuerySchema),
  asyncHandler(communityController.listarVisibles),
);
communityPublicRoutes.post(
  '/',
  crearPostLimiter,
  validateBody(crearPostSchema),
  asyncHandler(communityController.crear),
);
communityPublicRoutes.post(
  '/:id/rating',
  calificarLimiter,
  asyncHandler(communityController.calificar),
);
communityPublicRoutes.delete(
  '/:id/rating',
  calificarLimiter,
  asyncHandler(communityController.quitarCalificacion),
);

/** /api/admin/community - moderacion */
export const communityAdminRoutes = Router();

communityAdminRoutes.use(requireAdmin);

communityAdminRoutes.get(
  '/',
  validateQuery(listarPostsQuerySchema),
  asyncHandler(communityController.listarTodas),
);
communityAdminRoutes.patch(
  '/:id',
  validateBody(moderarPostSchema),
  asyncHandler(communityController.moderar),
);
communityAdminRoutes.delete('/:id', asyncHandler(communityController.eliminar));
