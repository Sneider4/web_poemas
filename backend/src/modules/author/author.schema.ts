import { z } from 'zod';

import { textoEnriquecido } from '../../utils/campo-enriquecido';

/**
 * Campos editables del autor. El panel los reparte en dos pantallas
 * (Pagina principal y Autor), asi que la actualizacion es PARCIAL:
 * cada una manda solo lo suyo y no pisa los campos de la otra.
 */
const camposAutor = z.object({
  name: z.string().min(1, 'El nombre no puede estar vacio').max(80),
  tagline: z.string().max(200).default(''),
  bio: textoEnriquecido(5000, { obligatorio: true, nombre: 'biografia' }),
  instagram: z.string().max(100).default(''),
  /** Ruta devuelta al subir la imagen (ej: "/uploads/autor/xxx.jpg"). */
  photo: z.string().max(300).default(''),

  // --- Portada ---
  heroImage: z.string().max(300).default(''),
  heroEyebrow: z.string().max(120).default(''),
  /** Vacio = se usan los primeros versos del poema destacado. */
  heroVerse: textoEnriquecido(400, { nombre: 'verso' }).default(''),
  manifesto: textoEnriquecido(500, { nombre: 'frase' }).default(''),
  manifestoNote: textoEnriquecido(800, { nombre: 'texto' }).default(''),
});

/**
 * Se valida lo que llega, pero nada es obligatorio: los campos ausentes
 * simplemente no se tocan. Un `name` presente igual tiene que ser valido.
 */
export const actualizarAutorSchema = camposAutor.partial();

export type ActualizarAutorDto = z.infer<typeof actualizarAutorSchema>;
