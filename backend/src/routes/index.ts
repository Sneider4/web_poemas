import { Router } from 'express';

import { prisma } from '../db/prisma';
import { adminAuthRoutes } from '../modules/admin-auth/admin-auth.routes';
import { authorAdminRoutes, authorPublicRoutes } from '../modules/author/author.routes';
import {
  communityAdminRoutes,
  communityPublicRoutes,
} from '../modules/community/community.routes';
import { poemsAdminRoutes, poemsPublicRoutes } from '../modules/poems/poems.routes';
import { uploadsRoutes } from '../modules/uploads/uploads.routes';
import { asyncHandler } from '../utils/async-handler';

export const apiRoutes = Router();

/** Health check: lo usa Railway y sirve para verificar la conexion a la base. */
apiRoutes.get(
  '/health',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', db: 'ok' });
    } catch {
      res.status(503).json({ status: 'ok', db: 'error' });
    }
  }),
);

// --- Rutas publicas ---
apiRoutes.use('/author', authorPublicRoutes);
apiRoutes.use('/poems', poemsPublicRoutes);
apiRoutes.use('/community', communityPublicRoutes);

// --- Rutas del panel de administracion ---
// El orden importa: adminAuthRoutes define /login, /logout, /me y /password
// directamente bajo /admin, y los sub-routers cuelgan de sus propios prefijos.
apiRoutes.use('/admin', adminAuthRoutes);
apiRoutes.use('/admin/author', authorAdminRoutes);
apiRoutes.use('/admin/poems', poemsAdminRoutes);
apiRoutes.use('/admin/community', communityAdminRoutes);
apiRoutes.use('/admin/uploads', uploadsRoutes);
