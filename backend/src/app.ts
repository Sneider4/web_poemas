import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { RAIZ_UPLOADS, RUTA_PUBLICA, prepararCarpetas } from './modules/uploads/uploads.config';
import { apiRoutes } from './routes';

export function createApp() {
  const app = express();

  // Railway (y cualquier proxy) reenvia la IP real en X-Forwarded-For.
  // Sin esto, el rate limiting y el hash de calificaciones verian
  // siempre la IP del proxy y tratarian a todos como el mismo visitante.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // Las imagenes subidas se muestran desde el frontend, que esta en
      // otro dominio (Vercel): sin esto el navegador las bloquearia.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: env.corsOrigins,
      // Necesario para que viaje la cookie de sesion del admin.
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  // Imagenes subidas desde el panel. Se sirven estaticas y con cache larga:
  // el nombre de cada archivo es unico, asi que nunca cambia su contenido.
  prepararCarpetas();
  app.use(
    RUTA_PUBLICA,
    express.static(RAIZ_UPLOADS, {
      maxAge: '30d',
      immutable: true,
      index: false,
    }),
  );

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
