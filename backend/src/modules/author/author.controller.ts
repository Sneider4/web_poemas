import type { Request, Response } from 'express';

import { authorService } from './author.service';
import type { ActualizarAutorDto } from './author.schema';

export const authorController = {
  /** GET /api/author - publico */
  async obtener(_req: Request, res: Response) {
    const autor = await authorService.obtener();
    res.json(autor);
  },

  /** PUT /api/admin/author - protegido */
  async actualizar(req: Request<unknown, unknown, ActualizarAutorDto>, res: Response) {
    const autor = await authorService.actualizar(req.body);
    res.json(autor);
  },
};
