import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API lista en http://localhost:${env.PORT}/api (entorno: ${env.NODE_ENV})`);
});

/** Cierre ordenado: deja de aceptar peticiones y suelta la conexion a Postgres. */
async function apagar(senal: string) {
  console.log(`\n${senal} recibido, cerrando el servidor...`);

  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0));
  });
}

process.on('SIGINT', () => void apagar('SIGINT'));
process.on('SIGTERM', () => void apagar('SIGTERM'));
