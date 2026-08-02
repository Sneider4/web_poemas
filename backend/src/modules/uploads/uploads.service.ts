import fs from 'node:fs/promises';
import path from 'node:path';

import { CATEGORIAS, RAIZ_UPLOADS, RUTA_PUBLICA, esCategoriaValida } from './uploads.config';
import { HttpError } from '../../utils/http-error';

export const uploadsService = {
  /** Ruta publica que se guarda en la base y consume el frontend. */
  rutaPublica(categoria: string, archivo: string): string {
    return `${RUTA_PUBLICA}/${categoria}/${archivo}`;
  },

  /**
   * Borra un archivo subido. Valida que la ruta este dentro de `uploads/`
   * y que use una categoria conocida: sin eso, un `../` en la peticion
   * permitiria borrar cualquier archivo del servidor.
   */
  async eliminar(rutaPublica: string): Promise<void> {
    const partes = rutaPublica.replace(/^\/+/, '').split('/');

    // Se espera exactamente: uploads / <categoria> / <archivo>
    if (partes.length !== 3 || partes[0] !== 'uploads') {
      throw HttpError.badRequest('Ruta de imagen invalida');
    }

    const [, categoria, archivo] = partes;

    if (!esCategoriaValida(categoria)) {
      throw HttpError.badRequest(`Categoria invalida. Validas: ${CATEGORIAS.join(', ')}`);
    }

    const destino = path.join(RAIZ_UPLOADS, categoria, path.basename(archivo));

    // Segunda barrera: el destino resuelto debe seguir dentro de la raiz.
    if (!destino.startsWith(RAIZ_UPLOADS)) {
      throw HttpError.badRequest('Ruta de imagen invalida');
    }

    try {
      await fs.unlink(destino);
    } catch (error) {
      // Que el archivo ya no exista no es un error para quien lo borra.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  },
};
