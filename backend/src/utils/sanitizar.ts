import sanitizeHtml from 'sanitize-html';

/**
 * Limpieza del texto enriquecido antes de guardarlo.
 *
 * Es una lista BLANCA: todo lo que no este aca se elimina. Es la unica
 * forma segura de aceptar HTML, sobre todo en la comunidad, donde cualquiera
 * publica sin cuenta y podria intentar inyectar codigo que se ejecute en el
 * navegador de los visitantes (incluida la sesion del admin).
 *
 * Se sanitiza al guardar, no solo al mostrar: asi nunca queda contenido
 * peligroso en la base, aunque en el futuro alguien lo lea desde otro lado.
 */

/** Formatos que puede usar Santiago en sus textos. */
const ETIQUETAS = [
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'del',
  'ul',
  'ol',
  'li',
  'br',
  'p',
  'div',
  'a',
];

const OPCIONES: sanitizeHtml.IOptions = {
  allowedTags: ETIQUETAS,
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  // Sin `javascript:` ni `data:`, que son las formas clasicas de meter
  // codigo dentro de un enlace aparentemente inocente.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  // Nada de estilos en linea: `style` permite trucos de superposicion
  // para engañar al que hace clic.
  allowedStyles: {},
  transformTags: {
    // Los enlaces siempre abren aparte y sin pasar credito de posicionamiento:
    // es lo que quita el incentivo al spam en la comunidad.
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'nofollow noopener noreferrer',
    }),
  },
  // A proposito NO se descartan los <a> que quedaron sin href.
  //
  // Cuando el enlace traia un esquema prohibido (`javascript:`), la libreria
  // le quita el href y queda un <a> inerte. Borrarlo se llevaria puesto el
  // texto que envuelve, y alguien perderia lo que escribio por un solo
  // enlace mal puesto. Un <a> sin href no hace nada.
};

/** Limpia un texto enriquecido dejando solo el formato permitido. */
export function sanitizarTextoEnriquecido(html: string): string {
  return sanitizeHtml(html, OPCIONES);
}

/**
 * Quita todo el HTML y devuelve el texto plano, conservando los saltos.
 * Sirve para medir longitudes reales y para donde no se puede mostrar
 * formato.
 */
export function aTextoPlano(html: string): string {
  const conSaltos = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ');

  return sanitizeHtml(conSaltos, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** True si, quitado el formato, no queda nada escrito. */
export function estaVacio(html: string): boolean {
  return aTextoPlano(html).length === 0;
}
