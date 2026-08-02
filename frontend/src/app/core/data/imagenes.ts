import { environment } from '../../../environments/environment';

/**
 * Resolucion de las imagenes del sitio.
 *
 * Las fotos se suben desde el panel y las guarda el backend, que devuelve
 * una ruta como "/uploads/poemas/xxx.jpg". Como el frontend puede estar en
 * otro dominio (Vercel) que la API (Railway), esa ruta hay que resolverla
 * contra el origen del backend antes de usarla.
 */

/** Origen del backend, derivado de la URL de la API ("...:3000/api" -> "...:3000"). */
const ORIGEN_API = environment.apiUrl.replace(/\/api\/?$/, '');

/**
 * Convierte lo que hay guardado en la base en una URL utilizable.
 * Acepta tambien una URL absoluta por si alguna imagen vive fuera.
 */
export function urlDeImagen(ruta: string): string {
  if (!ruta) {
    return '';
  }

  if (/^https?:\/\//i.test(ruta)) {
    return ruta;
  }

  return `${ORIGEN_API}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
}

/**
 * Degradado de respaldo cuando algo todavia no tiene foto.
 *
 * Se deriva del slug para que un mismo poema tenga siempre el mismo fondo
 * (no cambia entre recargas) y para que dos poemas contiguos se vean
 * distintos. Solo usa los grises de la paleta, asi la galeria se ve
 * intencional aunque aun no haya imagenes reales.
 */
export function degradadoPorSlug(slug: string): string {
  // Pares con suficiente distancia de luminosidad: si los dos tonos son
  // parecidos la tarjeta se ve como un rectangulo plano y apagado.
  const combinaciones = [
    ['#565656', '#2b2b2b'],
    ['#848484', '#3a3a3a'],
    ['#6d6d6d', '#2b2b2b'],
    ['#4a4a4a', '#7a7a7a'],
    ['#3a3a3a', '#6d6d6d'],
    ['#7a7a7a', '#333333'],
  ];

  // Suma de los codigos de caracter: barata, estable y suficiente para repartir.
  let acumulado = 0;
  for (let i = 0; i < slug.length; i += 1) {
    acumulado += slug.charCodeAt(i);
  }

  const [claro, oscuro] = combinaciones[acumulado % combinaciones.length];
  const angulo = 110 + (acumulado % 6) * 25;

  // Un halo desplazado le da profundidad y hace que dos tarjetas contiguas
  // no se confundan entre si.
  const posX = 20 + (acumulado % 4) * 20;
  const posY = 15 + (acumulado % 3) * 25;

  return [
    `radial-gradient(circle at ${posX}% ${posY}%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 55%)`,
    `linear-gradient(${angulo}deg, ${claro} 0%, ${oscuro} 100%)`,
  ].join(', ');
}

/**
 * Valor para `background-image`: la foto subida si la hay, o el degradado
 * determinista si todavia no se cargo ninguna.
 */
export function fondoDePoema(coverImage: string, slug: string): string {
  return coverImage ? `url('${urlDeImagen(coverImage)}')` : degradadoPorSlug(slug);
}
