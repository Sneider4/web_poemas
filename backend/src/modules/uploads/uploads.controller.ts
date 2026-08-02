import type { Request, Response } from 'express';

import { HttpError } from '../../utils/http-error';
import { esCategoriaValida } from './uploads.config';
import { optimizarImagen } from './uploads.optimizar';
import { uploadsService } from './uploads.service';

export const uploadsController = {
  /** POST /api/admin/uploads/:categoria */
  async subir(req: Request<{ categoria: string }>, res: Response) {
    if (!req.file) {
      throw HttpError.badRequest('No llego ningun archivo');
    }

    const { categoria } = req.params;

    // Ya lo valido multer al elegir la carpeta; se repite para que
    // TypeScript sepa que el tipo es correcto.
    if (!esCategoriaValida(categoria)) {
      throw HttpError.badRequest(`Categoria invalida: ${categoria}`);
    }

    const { bytes } = await optimizarImagen(req.file.path, categoria);

    res.status(201).json({
      url: uploadsService.rutaPublica(categoria, req.file.filename),
      bytes,
    });
  },

  /** DELETE /api/admin/uploads?url=/uploads/poemas/xxx.jpg */
  async eliminar(req: Request, res: Response) {
    const url = req.query.url;

    if (typeof url !== 'string' || !url) {
      throw HttpError.badRequest('Falta la url de la imagen a borrar');
    }

    await uploadsService.eliminar(url);
    res.status(204).send();
  },
};
