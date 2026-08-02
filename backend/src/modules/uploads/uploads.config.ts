import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

import multer from 'multer';

import { HttpError } from '../../utils/http-error';

/**
 * Carpetas permitidas. Es una lista blanca a proposito: el nombre de la
 * categoria viene del cliente y sin esta restriccion podria usarse para
 * escribir fuera de `uploads/` (path traversal).
 */
export const CATEGORIAS = ['poemas', 'portada', 'autor'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Raiz donde se guardan los archivos subidos. */
export const RAIZ_UPLOADS = path.resolve(process.cwd(), 'uploads');

/** Ruta publica desde la que se sirven. */
export const RUTA_PUBLICA = '/uploads';

export const LIMITE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Tipos aceptados con su extension. Se valida el mime declarado Y se
 * fuerza la extension desde esta tabla, para no confiar en el nombre
 * que envia el navegador.
 */
const TIPOS_ACEPTADOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function esCategoriaValida(valor: unknown): valor is Categoria {
  return typeof valor === 'string' && (CATEGORIAS as readonly string[]).includes(valor);
}

/** Crea las carpetas al arrancar para que la primera subida no falle. */
export function prepararCarpetas(): void {
  for (const categoria of CATEGORIAS) {
    fs.mkdirSync(path.join(RAIZ_UPLOADS, categoria), { recursive: true });
  }
}

const almacenamiento = multer.diskStorage({
  destination(req, _file, cb) {
    const categoria = req.params.categoria;

    if (!esCategoriaValida(categoria)) {
      cb(HttpError.badRequest(`Categoria invalida: ${categoria}`), '');
      return;
    }

    cb(null, path.join(RAIZ_UPLOADS, categoria));
  },

  filename(_req, file, cb) {
    // Nombre aleatorio: nunca se reutiliza el que manda el cliente, que
    // podria traer rutas ("../"), caracteres raros o colisionar.
    const extension = TIPOS_ACEPTADOS[file.mimetype] ?? '.bin';
    cb(null, `${randomUUID()}${extension}`);
  },
});

export const subirImagen = multer({
  storage: almacenamiento,
  limits: { fileSize: LIMITE_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!TIPOS_ACEPTADOS[file.mimetype]) {
      cb(HttpError.badRequest('Solo se aceptan imagenes JPG, PNG o WebP'));
      return;
    }

    cb(null, true);
  },
});
