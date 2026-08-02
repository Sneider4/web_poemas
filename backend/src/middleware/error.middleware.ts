import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { LIMITE_BYTES } from '../modules/uploads/uploads.config';
import { HttpError } from '../utils/http-error';

/** 404 para cualquier ruta que no exista. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/**
 * Traduce cualquier error a una respuesta JSON uniforme.
 * Debe registrarse al final, despues de todas las rutas.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  // Los errores de multer llegan con su propio tipo; sin esto un archivo
  // demasiado grande se reportaria como un 500 generico.
  if (err instanceof MulterError) {
    const mensaje =
      err.code === 'LIMIT_FILE_SIZE'
        ? `La imagen supera el limite de ${Math.round(LIMITE_BYTES / (1024 * 1024))} MB`
        : `No se pudo procesar el archivo (${err.code})`;

    res.status(400).json({ error: mensaje });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos invalidos',
      details: err.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      })),
    });
    return;
  }

  // Error inesperado: se registra completo en el servidor pero al cliente
  // solo le llega un mensaje generico (en produccion) para no filtrar detalles.
  console.error('[error no controlado]', err);

  res.status(500).json({
    error: env.isProduction ? 'Error interno del servidor' : String(err instanceof Error ? err.message : err),
  });
};
