/** Entidades que puede emitir el sanitizador del backend. */
const ENTIDADES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&#(\d+);/g, (_, codigo: string) => String.fromCodePoint(Number(codigo)))
    .replace(/&#x([\da-f]+);/gi, (_, codigo: string) => String.fromCodePoint(parseInt(codigo, 16)))
    .replace(/&[a-z]+;/gi, (entidad) => ENTIDADES[entidad.toLowerCase()] ?? entidad);
}

/**
 * Convierte texto con formato en texto plano, conservando los saltos.
 *
 * Hace falta en tres lugares donde el formato no se puede mostrar:
 * los adelantos de las tarjetas, el verso de la portada y la imagen para
 * compartir, que se dibuja sobre un lienzo.
 *
 * No usa el parser del navegador aunque seria mas corto: esto corre tambien
 * al renderizar en el servidor, donde no hay `document`, y si las dos
 * plataformas no devuelven exactamente lo mismo la hidratacion se queja.
 * Es seguro hacerlo con expresiones regulares porque el HTML que llega ya
 * paso por el sanitizador del backend, que solo deja una lista corta de
 * etiquetas simples.
 */
export function aTextoPlano(html: string): string {
  if (!html) {
    return '';
  }

  // Sin etiquetas no hay nada que convertir: se devuelve tal cual para no
  // perder los saltos del contenido viejo, que es texto plano.
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html;
  }

  const texto = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, '');

  return decodificarEntidades(texto)
    .replace(/ /g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
