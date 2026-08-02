import { prisma } from '../../db/prisma';
import { HttpError } from '../../utils/http-error';
import { slugify, uniqueSlug } from '../../utils/slugify';
import type { ActualizarPoemaDto, CrearPoemaDto, ListarPoemasQuery } from './poems.schema';

/** Orden del indice publico: primero el sortOrder manual, luego los mas nuevos. */
const ORDEN_PUBLICO = [{ sortOrder: 'asc' as const }, { publishedAt: 'desc' as const }];

export const poemsService = {
  /** Solo poemas publicados: es lo que ve cualquier visitante. */
  async listarPublicos({ featured, limit }: ListarPoemasQuery) {
    return prisma.poem.findMany({
      where: {
        published: true,
        ...(featured === undefined ? {} : { featured }),
      },
      orderBy: ORDEN_PUBLICO,
      take: limit,
    });
  },

  async obtenerPorSlug(slug: string) {
    const poema = await prisma.poem.findUnique({ where: { slug } });

    // Un poema despublicado se trata como inexistente para el publico.
    if (!poema || !poema.published) {
      throw HttpError.notFound('Ese poema no existe o aun no fue publicado');
    }

    return poema;
  },

  /** Incluye borradores: es la vista del panel de administracion. */
  async listarTodos() {
    return prisma.poem.findMany({ orderBy: ORDEN_PUBLICO });
  },

  async obtenerPorId(id: string) {
    const poema = await prisma.poem.findUnique({ where: { id } });

    if (!poema) {
      throw HttpError.notFound('Ese poema no existe');
    }

    return poema;
  },

  async crear(datos: CrearPoemaDto) {
    const slug = await this.resolverSlug(datos.slug ?? datos.title);

    return prisma.poem.create({
      data: {
        title: datos.title,
        slug,
        body: datos.body,
        coverImage: datos.coverImage,
        published: datos.published,
        featured: datos.featured,
        sortOrder: datos.sortOrder,
      },
    });
  },

  async actualizar(id: string, datos: ActualizarPoemaDto) {
    const actual = await this.obtenerPorId(id);

    // El slug solo se regenera si cambio el titulo o lo mandaron explicito,
    // para no romper enlaces ya compartidos de poemas existentes.
    let slug = actual.slug;
    if (datos.slug !== undefined) {
      slug = await this.resolverSlug(datos.slug, id);
    } else if (datos.title !== undefined && datos.title !== actual.title) {
      slug = await this.resolverSlug(datos.title, id);
    }

    return prisma.poem.update({
      where: { id },
      data: { ...datos, slug },
    });
  },

  async eliminar(id: string) {
    await this.obtenerPorId(id);
    await prisma.poem.delete({ where: { id } });
  },

  /** Genera un slug unico, ignorando el propio registro cuando se edita. */
  async resolverSlug(textoBase: string, idAExcluir?: string) {
    return uniqueSlug(slugify(textoBase), async (candidato) => {
      const existente = await prisma.poem.findUnique({ where: { slug: candidato } });
      return existente !== null && existente.id !== idAExcluir;
    });
  },
};
