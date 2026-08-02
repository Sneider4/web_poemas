export interface Author {
  id: number;
  name: string;
  tagline: string;
  bio: string;
  instagram: string;
  /** Foto del autor subida desde el panel (ej: "/uploads/autor/xxx.jpg"). */
  photo: string;

  // --- Portada ---
  /** Imagen de fondo del hero (ej: "/uploads/portada/xxx.jpg"). */
  heroImage: string;
  /** Antetitulo del hero, encima del verso grande. */
  heroEyebrow: string;
  /** Vacio = se usan los primeros versos del poema destacado. */
  heroVerse: string;
  /** Frase grande de la segunda seccion. */
  manifesto: string;
  /** Parrafo debajo de la frase. */
  manifestoNote: string;

  updatedAt: string;
}

/**
 * Payload para actualizar el autor. Es parcial porque el panel reparte
 * estos campos en dos pantallas y cada una envia solo los suyos.
 */
export type AuthorInput = Partial<Omit<Author, 'id' | 'updatedAt'>>;
