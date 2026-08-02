import { z } from 'zod';

import { textoEnriquecido } from '../../utils/campo-enriquecido';

/** Limites que el frontend replica en su contador de caracteres. */
export const LIMITES = {
  nombre: 60,
  contenido: 2000,
} as const;

export const crearPostSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(1, 'Escribe un nombre')
    .max(LIMITES.nombre, `Maximo ${LIMITES.nombre} caracteres`),
  type: z.enum(['POEM', 'OPINION', 'MUSIC']),
  // Es lo mas expuesto del sitio: lo escribe cualquiera sin cuenta, asi
  // que la sanitizacion de la lista blanca es imprescindible aca.
  content: textoEnriquecido(LIMITES.contenido, {
    obligatorio: true,
    nombre: 'contenido',
  }),
  /**
   * Honeypot: campo oculto por CSS que un humano nunca ve ni llena.
   * Si viene con texto, casi seguro es un bot.
   */
  website: z.string().max(0, 'Solicitud rechazada').optional(),
});

export type CrearPostDto = z.infer<typeof crearPostSchema>;

export const listarPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export type ListarPostsQuery = z.infer<typeof listarPostsQuerySchema>;

export const moderarPostSchema = z.object({
  hidden: z.boolean(),
});

export type ModerarPostDto = z.infer<typeof moderarPostSchema>;
