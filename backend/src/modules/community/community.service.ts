import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { HttpError } from '../../utils/http-error';
import type { CrearPostDto, ListarPostsQuery } from './community.schema';

/** Forma en que el frontend consume una publicacion: con su conteo de likes. */
function conConteo<T extends { _count: { ratings: number } }>(post: T) {
  const { _count, ...resto } = post;
  return { ...resto, ratingCount: _count.ratings };
}

export const communityService = {
  /** Tablero publico: solo publicaciones visibles, de la mas nueva a la mas vieja. */
  async listarVisibles({ page, pageSize }: ListarPostsQuery) {
    const where = { hidden: false };

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { ratings: true } } },
      }),
      prisma.communityPost.count({ where }),
    ]);

    return {
      items: posts.map(conConteo),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async crear(datos: CrearPostDto) {
    const post = await prisma.communityPost.create({
      data: {
        authorName: datos.authorName,
        type: datos.type,
        content: datos.content,
      },
      include: { _count: { select: { ratings: true } } },
    });

    return conConteo(post);
  },

  /**
   * Registra una calificacion. El constraint unico (postId, raterHash) es
   * la barrera real contra votos repetidos: si ya existe, Prisma lanza P2002
   * y respondemos 409 en vez de sumar otro voto.
   */
  async calificar(postId: string, raterHash: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });

    if (!post || post.hidden) {
      throw HttpError.notFound('Esa publicacion no existe');
    }

    try {
      await prisma.communityRating.create({ data: { postId, raterHash } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw HttpError.conflict('Ya calificaste esta publicacion');
      }
      throw error;
    }

    const ratingCount = await prisma.communityRating.count({ where: { postId } });
    return { postId, ratingCount, calificado: true };
  },

  /**
   * Quita la calificacion de este visitante. Borrar por el par unico
   * (postId, raterHash) garantiza que solo pueda retirar la suya.
   */
  async quitarCalificacion(postId: string, raterHash: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });

    if (!post || post.hidden) {
      throw HttpError.notFound('Esa publicacion no existe');
    }

    // `deleteMany` no falla si no habia calificacion previa: quitar algo
    // que no estaba puesto deja el mismo resultado que se pedia.
    await prisma.communityRating.deleteMany({ where: { postId, raterHash } });

    const ratingCount = await prisma.communityRating.count({ where: { postId } });
    return { postId, ratingCount, calificado: false };
  },

  /** Vista de moderacion: incluye las publicaciones ocultas. */
  async listarTodas({ page, pageSize }: ListarPostsQuery) {
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { ratings: true } } },
      }),
      prisma.communityPost.count(),
    ]);

    return {
      items: posts.map(conConteo),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  /** Ocultar en vez de borrar permite revertir una moderacion equivocada. */
  async moderar(id: string, hidden: boolean) {
    await this.asegurarQueExiste(id);

    const post = await prisma.communityPost.update({
      where: { id },
      data: { hidden },
      include: { _count: { select: { ratings: true } } },
    });

    return conConteo(post);
  },

  async eliminar(id: string) {
    await this.asegurarQueExiste(id);
    await prisma.communityPost.delete({ where: { id } });
  },

  async asegurarQueExiste(id: string) {
    const post = await prisma.communityPost.findUnique({ where: { id } });

    if (!post) {
      throw HttpError.notFound('Esa publicacion no existe');
    }

    return post;
  },
};
