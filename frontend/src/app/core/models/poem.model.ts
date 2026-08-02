export interface Poem {
  id: string;
  title: string;
  slug: string;
  body: string;
  /** Ruta dentro de public/ (ej: "img/poemas/grietas.jpg"). Vacio = degradado. */
  coverImage: string;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Campos que el panel envia al crear o editar un poema. */
export interface PoemInput {
  title: string;
  body: string;
  coverImage: string;
  published: boolean;
  featured: boolean;
  sortOrder: number;
}
