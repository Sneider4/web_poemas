/** Marcas diacriticas combinantes (tildes, dieresis) que deja `normalize('NFD')`. */
const DIACRITICOS = /[̀-ͯ]/g;

/**
 * Convierte un titulo en un slug apto para URL.
 * "Mujer palida (dedicado a ella)" -> "mujer-palida-dedicado-a-ella"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    // Separa la letra de su tilde y descarta la tilde: "adiós" -> "adios".
    .replace(DIACRITICOS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Genera un slug unico agregando un sufijo numerico si ya existe.
 * `slugExiste` consulta la base y debe excluir el propio registro al editar.
 */
export async function uniqueSlug(
  title: string,
  slugExiste: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(title) || 'poema';
  let candidato = base;
  let sufijo = 2;

  while (await slugExiste(candidato)) {
    candidato = `${base}-${sufijo}`;
    sufijo += 1;
  }

  return candidato;
}
