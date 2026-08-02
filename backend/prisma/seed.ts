import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import { generarCodigoRecuperacion, normalizarCodigo } from '../src/utils/codigo-recuperacion';
import { slugify } from '../src/utils/slugify';
import { POEMAS } from './data/poemas';

dotenv.config();

const prisma = new PrismaClient();

const BIO = `Ganas de expresar todo y sentir todo.

Escribo desde lo romántico hasta lo más crudo, porque creo en dos cosas: que se exprese lo que se vive, y que se muera lo insufrible.

Esta página es mi forma de comunicarme de la única manera que conozco; burlándome de la desgracia humana.

Todos estos poemas son de mi autoría.`;

async function main() {
  console.log('Sembrando la base de datos...\n');

  // --- Admin ---
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Faltan ADMIN_USERNAME y/o ADMIN_INITIAL_PASSWORD en backend/.env; sin eso no se puede crear el usuario admin.',
    );
  }

  const admin = await prisma.adminUser.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Admin listo: ${admin.username}`);

  // Codigo de recuperacion inicial. Solo se genera si no hay ninguno, para
  // no invalidar en silencio uno que Santiago ya tenga guardado.
  if (!admin.recoveryCodeHash) {
    const codigo = generarCodigoRecuperacion();

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { recoveryCodeHash: await bcrypt.hash(normalizarCodigo(codigo), 12) },
    });

    console.log('');
    console.log('  ┌──────────────────────────────────────────────┐');
    console.log(`  │  CODIGO DE RECUPERACION: ${codigo}  │`);
    console.log('  └──────────────────────────────────────────────┘');
    console.log('  Guardalo: no vuelve a mostrarse. Sirve una sola vez');
    console.log('  para poner una contrasena nueva si se olvida.');
    console.log('');
  }

  // --- Autor ---
  const TEXTOS_PORTADA = {
    heroEyebrow: 'Santiago a secas',
    // Vacio a proposito: por defecto el hero toma los primeros versos del
    // poema destacado. Santiago puede fijar un texto propio desde el panel.
    heroVerse: '',
    manifesto: 'Que se exprese lo que se vive, y que se muera lo insufrible.',
    manifestoNote:
      'Escribo desde lo romántico hasta lo más crudo. Esta página es mi forma de comunicarme de la única manera que conozco.',
  };

  const autor = await prisma.author.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Santiago',
      tagline: 'Poemas de un solitario para otro solitario',
      bio: BIO,
      instagram: 'santiago_a_secas__',
      ...TEXTOS_PORTADA,
    },
  });

  // Si el autor ya existia (base creada antes de estos campos), se rellenan
  // solo los textos que esten vacios: nunca se pisa lo que Santiago escribio.
  const faltantes: Partial<typeof TEXTOS_PORTADA> = {};

  if (!autor.heroEyebrow.trim()) faltantes.heroEyebrow = TEXTOS_PORTADA.heroEyebrow;
  if (!autor.manifesto.trim()) faltantes.manifesto = TEXTOS_PORTADA.manifesto;
  if (!autor.manifestoNote.trim()) faltantes.manifestoNote = TEXTOS_PORTADA.manifestoNote;

  if (Object.keys(faltantes).length > 0) {
    await prisma.author.update({ where: { id: 1 }, data: faltantes });
    console.log(`Textos de portada rellenados: ${Object.keys(faltantes).join(', ')}`);
  }
  console.log(`Autor listo: ${autor.name}`);

  // --- Poemas ---
  let creados = 0;
  let actualizados = 0;

  for (const [indice, poema] of POEMAS.entries()) {
    const slug = slugify(poema.title);

    const datos = {
      title: poema.title,
      body: poema.body,
      published: true,
      // Los tres primeros son los destacados de la portada,
      // igual que en el sitio anterior.
      featured: indice < 3,
      sortOrder: indice,
    };

    const existente = await prisma.poem.findUnique({ where: { slug } });

    if (existente) {
      await prisma.poem.update({ where: { slug }, data: datos });
      actualizados += 1;
    } else {
      await prisma.poem.create({ data: { ...datos, slug } });
      creados += 1;
    }
  }

  console.log(`Poemas creados: ${creados} | actualizados: ${actualizados}`);
  console.log(`\nListo: ${POEMAS.length} poemas publicados con su texto.`);
}

main()
  .catch((error) => {
    console.error('Fallo el seed:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
