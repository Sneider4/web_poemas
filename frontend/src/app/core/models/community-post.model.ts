export type CommunityPostType = 'POEM' | 'OPINION' | 'MUSIC';

export interface CommunityPost {
  id: string;
  authorName: string;
  type: CommunityPostType;
  content: string;
  hidden: boolean;
  createdAt: string;
  ratingCount: number;
}

/** Datos que envia el formulario del tablero. */
export interface CommunityPostInput {
  authorName: string;
  type: CommunityPostType;
  content: string;
  /** Honeypot: siempre vacio en un envio humano. */
  website?: string;
}

/** Respuesta paginada del listado de publicaciones. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Etiquetas en espanol para cada tipo, usadas en la UI. */
export const TIPOS_PUBLICACION: ReadonlyArray<{ value: CommunityPostType; label: string }> = [
  { value: 'POEM', label: 'Un poema' },
  { value: 'OPINION', label: 'Una opinión' },
  { value: 'MUSIC', label: 'Música' },
];

/** Limites que replican los del backend (community.schema.ts). */
export const LIMITES_PUBLICACION = {
  nombre: 60,
  contenido: 2000,
} as const;
