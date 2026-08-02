import { prisma } from '../../db/prisma';
import type { ActualizarAutorDto } from './author.schema';

/** La tabla `author` guarda una sola fila, siempre con id = 1. */
const AUTHOR_ID = 1;

const AUTOR_POR_DEFECTO = {
  id: AUTHOR_ID,
  name: 'Santiago',
  tagline: 'Poemas de un solitario para otro solitario',
  bio: 'Un intento de escritor, a veces de persona.',
  instagram: 'santiago_a_secas__',
  photo: '',
  heroImage: '',
  heroEyebrow: 'Santiago a secas',
  heroVerse: '',
  manifesto: 'Que se exprese lo que se vive, y que se muera lo insufrible.',
  manifestoNote:
    'Escribo desde lo romantico hasta lo mas crudo. Esta pagina es mi forma de comunicarme de la unica manera que conozco.',
} as const;

export const authorService = {
  /**
   * Devuelve el autor; si aun no existe la fila (base recien creada sin seed)
   * la crea con los valores por defecto para que el front nunca reciba null.
   */
  async obtener() {
    const autor = await prisma.author.findUnique({ where: { id: AUTHOR_ID } });

    if (autor) {
      return autor;
    }

    return prisma.author.create({ data: AUTOR_POR_DEFECTO });
  },

  /**
   * Actualiza solo los campos que llegan. `obtener()` garantiza que la fila
   * exista, asi que basta con un update parcial: lo que no venga en `datos`
   * conserva su valor, que es lo que permite editarlo desde dos pantallas
   * distintas sin que una pise a la otra.
   */
  async actualizar(datos: ActualizarAutorDto) {
    await this.obtener();

    return prisma.author.update({
      where: { id: AUTHOR_ID },
      data: datos,
    });
  },
};
