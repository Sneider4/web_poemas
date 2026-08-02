import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import type { Categoria } from './uploads.config';

/**
 * Ancho maximo segun donde se use la imagen.
 *
 * Sin esto se sirve el archivo tal como salio del telefono: una foto de
 * 4000 px y varios MB llega entera al celular de quien entra al sitio,
 * cuando en pantalla nunca se ve a mas de 1920.
 */
const ANCHO_MAXIMO: Record<Categoria, number> = {
  portada: 1920, // ocupa toda la pantalla
  poemas: 1600, // cabecera del poema y galeria
  autor: 900, // retrato al costado de la biografia
};

/** Calidad de compresion: 82 es el punto donde deja de notarse la diferencia. */
const CALIDAD = 82;

/**
 * Redimensiona y comprime la imagen recien subida, sobreescribiendola.
 *
 * Todo el trabajo se hace en memoria (el limite de subida son 5 MB) porque
 * en Windows sharp deja abierto el archivo de entrada, y renombrar un
 * temporal encima falla con EPERM.
 *
 * Si el procesamiento falla se deja la imagen original: es preferible una
 * foto pesada a una subida que se pierde.
 */
export async function optimizarImagen(
  rutaArchivo: string,
  categoria: Categoria,
): Promise<{ optimizada: boolean; bytes: number }> {
  const original = await fs.readFile(rutaArchivo);

  try {
    const metadatos = await sharp(original).metadata();

    let procesada = sharp(original).rotate(); // respeta la orientacion EXIF

    if ((metadatos.width ?? 0) > ANCHO_MAXIMO[categoria]) {
      procesada = procesada.resize({ width: ANCHO_MAXIMO[categoria], withoutEnlargement: true });
    }

    // Se reescribe en el mismo formato que indica la extension: el nombre
    // del archivo ya viajo al cliente, y cambiar el contenido sin cambiar
    // la extension deja imagenes que algunos visores rechazan.
    switch (path.extname(rutaArchivo).toLowerCase()) {
      case '.png':
        procesada = procesada.png({ compressionLevel: 9 });
        break;
      case '.webp':
        procesada = procesada.webp({ quality: CALIDAD });
        break;
      default:
        procesada = procesada.jpeg({ quality: CALIDAD, mozjpeg: true });
    }

    const resultado = await procesada.toBuffer();

    // Si el procesado quedo mas pesado (puede pasar con imagenes ya
    // optimizadas), se descarta y se deja la original.
    if (resultado.length >= original.length) {
      return { optimizada: false, bytes: original.length };
    }

    await fs.writeFile(rutaArchivo, resultado);
    return { optimizada: true, bytes: resultado.length };
  } catch (error) {
    console.error('[uploads] no se pudo optimizar la imagen:', error);
    return { optimizada: false, bytes: original.length };
  }
}
