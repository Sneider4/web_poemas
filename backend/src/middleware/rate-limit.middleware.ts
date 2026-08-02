import rateLimit from 'express-rate-limit';

/**
 * El tablero de la comunidad se publica sin cuenta de usuario, asi que el
 * limite por IP es la primera barrera contra spam. La segunda es la
 * moderacion manual desde el panel admin.
 */
export const crearPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Estas publicando demasiado rapido. Intenta de nuevo en unos minutos.' },
});

/**
 * Las calificaciones ya estan deduplicadas por constraint unico en la base;
 * este limite solo evita que alguien martille el endpoint.
 */
export const calificarLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas calificaciones seguidas. Espera un momento.' },
});

/** Limite del login del admin: frena fuerza bruta contra la contrasena. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de acceso. Intenta de nuevo mas tarde.' },
});

/**
 * Limite de la recuperacion, mucho mas estricto que el del login.
 *
 * El codigo es la unica barrera cuando se olvido la contrasena, y a
 * diferencia del login no hay un segundo factor: conviene que probar
 * codigos al azar sea inviable por tiempo, no solo por entropia.
 */
export const recuperacionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: 'Demasiados intentos de recuperacion. Intenta de nuevo en una hora.',
  },
});
