import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Los middleware se declaran con genericos abiertos para poder encadenarse
 * con controladores que tipan sus propios params/body sin que TypeScript
 * intente unificar ambas firmas.
 */
type AnyRequestHandler = RequestHandler<any, any, any, any>;

/**
 * Valida `req.body` contra un esquema de zod y lo reemplaza por el
 * resultado parseado (ya con defaults aplicados y tipos convertidos).
 * Si falla, el ZodError lo formatea el middleware de errores.
 */
export const validateBody = (schema: ZodTypeAny): AnyRequestHandler => (req, _res, next) => {
  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    next(resultado.error);
    return;
  }

  req.body = resultado.data;
  next();
};

/**
 * Igual que `validateBody` pero para los query params.
 * El resultado queda en `res.locals.query`: en Express reasignar `req.query`
 * completo no es fiable, y asi el controlador lo lee ya tipado con `getQuery`.
 */
export const validateQuery = (schema: ZodTypeAny): AnyRequestHandler => (req, res, next) => {
  const resultado = schema.safeParse(req.query);

  if (!resultado.success) {
    next(resultado.error);
    return;
  }

  res.locals.query = resultado.data;
  next();
};

/** Lee el query ya validado por `validateQuery`, tipado. */
export function getQuery<T>(res: { locals: Record<string, unknown> }): T {
  return res.locals.query as T;
}
