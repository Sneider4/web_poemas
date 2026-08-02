import type { Request, Response } from 'express';

import { getQuery } from '../../middleware/validate.middleware';
import { poemsService } from './poems.service';
import type { ActualizarPoemaDto, CrearPoemaDto, ListarPoemasQuery } from './poems.schema';

export const poemsController = {
  /** GET /api/poems?featured=true&limit=3 - publico */
  async listarPublicos(_req: Request, res: Response) {
    const poemas = await poemsService.listarPublicos(getQuery<ListarPoemasQuery>(res));
    res.json(poemas);
  },

  /** GET /api/poems/:slug - publico */
  async obtenerPorSlug(req: Request<{ slug: string }>, res: Response) {
    const poema = await poemsService.obtenerPorSlug(req.params.slug);
    res.json(poema);
  },

  /** GET /api/admin/poems - protegido (incluye borradores) */
  async listarTodos(_req: Request, res: Response) {
    const poemas = await poemsService.listarTodos();
    res.json(poemas);
  },

  /** GET /api/admin/poems/:id - protegido */
  async obtenerPorId(req: Request<{ id: string }>, res: Response) {
    const poema = await poemsService.obtenerPorId(req.params.id);
    res.json(poema);
  },

  /** POST /api/admin/poems - protegido */
  async crear(req: Request<unknown, unknown, CrearPoemaDto>, res: Response) {
    const poema = await poemsService.crear(req.body);
    res.status(201).json(poema);
  },

  /** PUT /api/admin/poems/:id - protegido */
  async actualizar(req: Request<{ id: string }, unknown, ActualizarPoemaDto>, res: Response) {
    const poema = await poemsService.actualizar(req.params.id, req.body);
    res.json(poema);
  },

  /** DELETE /api/admin/poems/:id - protegido */
  async eliminar(req: Request<{ id: string }>, res: Response) {
    await poemsService.eliminar(req.params.id);
    res.status(204).send();
  },
};
