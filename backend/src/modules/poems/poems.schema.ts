import { z } from 'zod';

import { textoEnriquecido } from '../../utils/campo-enriquecido';

export const listarPoemasQuerySchema = z.object({
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? undefined : valor === 'true')),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListarPoemasQuery = z.infer<typeof listarPoemasQuerySchema>;

export const crearPoemaSchema = z.object({
  title: z.string().min(1, 'El titulo es obligatorio').max(200),
  body: textoEnriquecido(20000, { nombre: 'poema' }).default(''),
  /** Ruta relativa dentro de frontend/public; vacio usa el degradado de respaldo. */
  coverImage: z.string().max(300).default(''),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  /** Si se omite, se genera a partir del titulo. */
  slug: z.string().max(220).optional(),
});

export type CrearPoemaDto = z.infer<typeof crearPoemaSchema>;

/** En la edicion todos los campos son opcionales (PATCH-like sobre PUT). */
export const actualizarPoemaSchema = crearPoemaSchema.partial();

export type ActualizarPoemaDto = z.infer<typeof actualizarPoemaSchema>;
