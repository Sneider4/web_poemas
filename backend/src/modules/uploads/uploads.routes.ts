import { Router } from 'express';

import { requireAdmin } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uploadsController } from './uploads.controller';
import { subirImagen } from './uploads.config';

/** /api/admin/uploads - solo el admin puede subir o borrar imagenes. */
export const uploadsRoutes = Router();

uploadsRoutes.use(requireAdmin);

uploadsRoutes.post(
  '/:categoria',
  subirImagen.single('file'),
  asyncHandler(uploadsController.subir),
);

uploadsRoutes.delete('/', asyncHandler(uploadsController.eliminar));
