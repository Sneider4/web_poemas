import type { Request, Response } from 'express';

import { getQuery } from '../../middleware/validate.middleware';
import { raterHashFromRequest } from '../../utils/hash-ip';
import { communityService } from './community.service';
import type { CrearPostDto, ListarPostsQuery, ModerarPostDto } from './community.schema';

export const communityController = {
  /** GET /api/community?page=1&pageSize=20 - publico */
  async listarVisibles(_req: Request, res: Response) {
    const resultado = await communityService.listarVisibles(getQuery<ListarPostsQuery>(res));
    res.json(resultado);
  },

  /** POST /api/community - publico, sin login */
  async crear(req: Request<unknown, unknown, CrearPostDto>, res: Response) {
    const post = await communityService.crear(req.body);
    res.status(201).json(post);
  },

  /** POST /api/community/:id/rating - publico, una vez por visitante */
  async calificar(req: Request<{ id: string }>, res: Response) {
    const resultado = await communityService.calificar(req.params.id, raterHashFromRequest(req));
    res.status(201).json(resultado);
  },

  /** DELETE /api/community/:id/rating - publico, retira la propia */
  async quitarCalificacion(req: Request<{ id: string }>, res: Response) {
    const resultado = await communityService.quitarCalificacion(
      req.params.id,
      raterHashFromRequest(req),
    );
    res.json(resultado);
  },

  /** GET /api/admin/community - protegido, incluye ocultas */
  async listarTodas(_req: Request, res: Response) {
    const resultado = await communityService.listarTodas(getQuery<ListarPostsQuery>(res));
    res.json(resultado);
  },

  /** PATCH /api/admin/community/:id - protegido, ocultar o mostrar */
  async moderar(req: Request<{ id: string }, unknown, ModerarPostDto>, res: Response) {
    const post = await communityService.moderar(req.params.id, req.body.hidden);
    res.json(post);
  },

  /** DELETE /api/admin/community/:id - protegido, borrado definitivo */
  async eliminar(req: Request<{ id: string }>, res: Response) {
    await communityService.eliminar(req.params.id);
    res.status(204).send();
  },
};
