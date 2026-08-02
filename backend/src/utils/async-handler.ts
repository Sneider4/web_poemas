import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParamsDictionary, Query } from 'express-serve-static-core';

/**
 * Envuelve un controlador async para que cualquier promesa rechazada
 * llegue al middleware de errores. Sin esto, Express 4 deja colgada
 * la peticion ante un `throw` dentro de un async.
 *
 * Es generico para conservar los tipos que declara cada controlador
 * (por ejemplo `Request<{ id: string }, unknown, CrearPoemaDto>`).
 */
export const asyncHandler =
  <P = ParamsDictionary, ResBody = unknown, ReqBody = unknown, ReqQuery = Query>(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response<ResBody>,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
