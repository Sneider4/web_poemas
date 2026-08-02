import { urlDeImagen } from '../../../core/data/imagenes';
import type { Poem } from '../../../core/models/poem.model';
import { aTextoPlano } from '../../utils/texto-plano';

/** Formatos en los que se puede exportar el poema. */
export type FormatoImagen = 'historia' | 'publicacion';

export const FORMATOS: Record<FormatoImagen, { ancho: number; alto: number; etiqueta: string }> = {
  // Historia de Instagram (9:16).
  historia: { ancho: 1080, alto: 1920, etiqueta: 'Historia' },
  // Publicación vertical de feed (4:5), el que más espacio ocupa en el muro.
  publicacion: { ancho: 1080, alto: 1350, etiqueta: 'Publicación' },
};

const COLOR_FONDO = '#2b2b2b';
const COLOR_TEXTO = '#e0e0e0';
const COLOR_SUAVE = '#c9c9c9';
const COLOR_TENUE = '#9a9a9a';

const FUENTE_SERIF = 'Georgia, "Times New Roman", serif';
const FUENTE_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Límites del autoajuste: se busca el mayor tamaño que entre. */
const TAM_MAX = 64;
const TAM_MIN = 34;

/**
 * Las fotos ya cargadas, para no volver a pedirlas en cada redibujo.
 * Al arrastrar la ventana se regenera muchas veces por segundo y sin esto
 * cada cuadro esperaria a la red.
 */
const fotosEnMemoria = new Map<string, HTMLImageElement | null>();

/**
 * Separa el cuerpo del poema en estrofas, y cada estrofa en sus versos.
 */
export function estrofasDelPoema(cuerpo: string): string[][] {
  // El lienzo dibuja texto: el formato se quita acá, porque `fillText` no
  // entiende etiquetas y las escribiría tal cual.
  return aTextoPlano(cuerpo)
    .split(/\n\s*\n/)
    .map((estrofa) =>
      estrofa
        .split('\n')
        .map((verso) => verso.trim())
        .filter(Boolean),
    )
    .filter((estrofa) => estrofa.length > 0);
}

/** Medidas de las zonas del lienzo para un formato dado. */
function calcularZonas(formato: FormatoImagen) {
  const { ancho, alto } = FORMATOS[formato];
  const margen = Math.round(ancho * 0.12);

  return {
    ancho,
    alto,
    margen,
    anchoUtil: ancho - margen * 2,
    tamTitulo: Math.round(ancho * 0.068),
    inicioTitulo: Math.round(alto * 0.17),
    pieDesde: alto - Math.round(alto * 0.14),
  };
}

/**
 * Calcula como queda el texto sin dibujar nada.
 *
 * Lo usan tanto el dibujo como la pantalla de vista previa, asi el
 * desplazamiento maximo que se puede elegir es exactamente el que la
 * imagen admite.
 */
export function calcularDisposicion(titulo: string, cuerpo: string, formato: FormatoImagen) {
  const zonas = calcularZonas(formato);

  const lienzo = document.createElement('canvas');
  lienzo.width = zonas.ancho;
  lienzo.height = zonas.alto;
  const ctx = lienzo.getContext('2d');

  if (!ctx) {
    throw new Error('El navegador no permitio medir el texto');
  }

  ctx.font = `italic ${zonas.tamTitulo}px ${FUENTE_SERIF}`;
  const lineasTitulo = ajustarTexto(ctx, titulo, zonas.anchoUtil);

  const finTitulo = zonas.inicioTitulo + lineasTitulo.length * zonas.tamTitulo * 1.2;
  const inicioCuerpo = finTitulo + Math.round(zonas.alto * 0.06);
  const espacioCuerpo = zonas.pieDesde - inicioCuerpo;

  const ajuste = ajustarAlEspacio(ctx, estrofasDelPoema(cuerpo), zonas.anchoUtil, espacioCuerpo);

  return {
    ...zonas,
    lineasTitulo,
    inicioCuerpo,
    espacioCuerpo,
    ...ajuste,
    /**
     * Cuanto se puede desplazar la ventana. Cero significa que el poema
     * entra completo y no hay nada que elegir.
     */
    desplazamientoMaximo: Math.max(0, ajuste.altoTexto - espacioCuerpo),
  };
}

/**
 * Dibuja el poema listo para compartir.
 *
 * El poema se dibuja entero y se recorta a la ventana visible: moviendo
 * `desplazamiento` se elige que parte queda dentro, como al acomodar el
 * fragmento de una cancion.
 */
export async function generarImagenDelPoema(
  poema: Poem,
  autor: string,
  formato: FormatoImagen,
  desplazamiento = 0,
): Promise<Blob> {
  const d = calcularDisposicion(poema.title, poema.body, formato);
  const { ancho, alto } = d;

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;

  const ctx = lienzo.getContext('2d');

  if (!ctx) {
    throw new Error('El navegador no permitio crear el lienzo');
  }

  const corrimiento = Math.min(Math.max(0, desplazamiento), d.desplazamientoMaximo);

  // --- Fondo ---
  ctx.fillStyle = COLOR_FONDO;
  ctx.fillRect(0, 0, ancho, alto);

  const foto = poema.coverImage ? await cargarImagen(urlDeImagen(poema.coverImage)) : null;

  if (foto) {
    dibujarCubriendo(ctx, foto, ancho, alto);
    aplicarVelo(ctx, ancho, alto);
  } else {
    const halo = ctx.createRadialGradient(ancho / 2, alto * 0.35, 0, ancho / 2, alto * 0.35, alto * 0.6);
    halo.addColorStop(0, 'rgba(224, 224, 224, 0.08)');
    halo.addColorStop(1, 'rgba(224, 224, 224, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, ancho, alto);
  }

  ctx.textAlign = 'center';

  // --- Título ---
  ctx.fillStyle = COLOR_TEXTO;
  ctx.font = `italic ${d.tamTitulo}px ${FUENTE_SERIF}`;

  let y = d.inicioTitulo;
  for (const linea of d.lineasTitulo) {
    ctx.fillText(linea, ancho / 2, y);
    y += d.tamTitulo * 1.2;
  }

  // --- Filete separador ---
  y += d.tamTitulo * 0.5;
  ctx.strokeStyle = COLOR_TENUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ancho / 2 - 60, y);
  ctx.lineTo(ancho / 2 + 60, y);
  ctx.stroke();

  // --- Cuerpo del poema, recortado a su ventana ---
  // El texto va en su propia capa transparente. Asi los bordes se
  // desvanecen borrando las letras, sin pintar una banda oscura encima
  // de la foto: sobre el fondo se notaba como un parche.
  const zonaTexto = {
    y: d.inicioCuerpo - d.tamano,
    alto: d.espacioCuerpo + d.tamano,
  };

  const capa = document.createElement('canvas');
  capa.width = ancho;
  capa.height = alto;
  const capaCtx = capa.getContext('2d');

  if (capaCtx) {
    capaCtx.textAlign = 'center';
    capaCtx.save();
    capaCtx.beginPath();
    capaCtx.rect(0, zonaTexto.y, ancho, zonaTexto.alto);
    capaCtx.clip();

    capaCtx.fillStyle = COLOR_SUAVE;
    capaCtx.font = `${d.tamano}px ${FUENTE_SERIF}`;

    const altoLinea = d.tamano * 1.55;
    // Cuando el poema entra completo se centra; si no, manda el corrimiento.
    const sobra = Math.max(0, d.espacioCuerpo - d.altoTexto);
    let yTexto = d.inicioCuerpo + sobra / 2 - corrimiento;

    for (const bloque of d.bloques) {
      for (const linea of bloque) {
        capaCtx.fillText(linea, ancho / 2, yTexto);
        yTexto += altoLinea;
      }
      yTexto += altoLinea * 0.55;
    }

    capaCtx.restore();

    // Borra las letras cerca de los bordes: indica que el poema sigue.
    const franja = d.tamano * 1.8;

    if (corrimiento > 1) {
      borrarDegradado(capaCtx, ancho, zonaTexto.y, franja, 'arriba');
    }

    if (corrimiento < d.desplazamientoMaximo - 1) {
      borrarDegradado(capaCtx, ancho, zonaTexto.y + zonaTexto.alto - franja, franja, 'abajo');
    }

    ctx.drawImage(capa, 0, 0);
  }

  // --- Pie con la firma ---
  const hayMas = d.desplazamientoMaximo > 0;

  ctx.fillStyle = COLOR_TEXTO;
  ctx.font = `500 ${Math.round(ancho * 0.032)}px ${FUENTE_SANS}`;
  ctx.fillText(`@${autor}`, ancho / 2, alto - Math.round(alto * 0.075));

  ctx.fillStyle = COLOR_TENUE;
  ctx.font = `${Math.round(ancho * 0.026)}px ${FUENTE_SANS}`;
  ctx.fillText(
    hayMas ? 'Leelo completo en el sitio' : 'Poemas de un solitario para otro solitario',
    ancho / 2,
    alto - Math.round(alto * 0.042),
  );

  return new Promise((resolve, reject) => {
    lienzo.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo exportar la imagen'))),
      'image/png',
    );
  });
}

/**
 * Borra el texto de forma progresiva cerca del borde de la ventana, para
 * que no aparezca cortado de golpe y se note que el poema sigue.
 *
 * Usa `destination-out`: en vez de pintar encima, quita lo ya dibujado.
 * Por eso funciona sobre cualquier fondo, incluida una foto.
 */
function borrarDegradado(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  y: number,
  alto: number,
  lado: 'arriba' | 'abajo',
): void {
  const grad = ctx.createLinearGradient(0, y, 0, y + alto);
  const opaco = 'rgba(0, 0, 0, 1)';
  const transparente = 'rgba(0, 0, 0, 0)';

  grad.addColorStop(0, lado === 'arriba' ? opaco : transparente);
  grad.addColorStop(1, lado === 'arriba' ? transparente : opaco);

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, ancho, alto);
  ctx.restore();
}

/**
 * Carga la foto para poder dibujarla. `crossOrigin` es imprescindible:
 * la imagen viene del backend, que esta en otro origen, y sin eso el
 * lienzo queda "contaminado" y el navegador prohibe exportarlo.
 * Si falla (sin conexion, CORS, 404) se resuelve en null y se usa el
 * fondo liso, que siempre funciona.
 */
async function cargarImagen(url: string): Promise<HTMLImageElement | null> {
  if (fotosEnMemoria.has(url)) {
    return fotosEnMemoria.get(url) ?? null;
  }

  const imagen = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

  fotosEnMemoria.set(url, imagen);
  return imagen;
}

/** Dibuja la foto cubriendo todo el lienzo, sin deformarla. */
function dibujarCubriendo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  ancho: number,
  alto: number,
): void {
  const escala = Math.max(ancho / img.width, alto / img.height);
  const w = img.width * escala;
  const h = img.height * escala;

  ctx.drawImage(img, (ancho - w) / 2, (alto - h) / 2, w, h);
}

/**
 * Oscurece la foto para que los versos se lean encima.
 * Es deliberadamente fuerte: si la foto es clara, un velo suave dejaria
 * el poema ilegible, que es lo unico que no se puede permitir aca.
 */
function aplicarVelo(ctx: CanvasRenderingContext2D, ancho: number, alto: number): void {
  const velo = ctx.createLinearGradient(0, 0, 0, alto);
  velo.addColorStop(0, 'rgba(43, 43, 43, 0.82)');
  velo.addColorStop(0.5, 'rgba(43, 43, 43, 0.72)');
  velo.addColorStop(1, 'rgba(43, 43, 43, 0.9)');

  ctx.fillStyle = velo;
  ctx.fillRect(0, 0, ancho, alto);
}

/**
 * Busca el mayor tamaño de letra con el que el poema entra completo.
 *
 * Se prioriza que ningun verso se parta en dos: en poesia el verso es la
 * unidad, y romperlo cambia como se lee.
 *
 * Si ni con el minimo entra, NO se recorta: se devuelve el poema entero al
 * tamaño minimo y es la ventana la que decide que parte se ve.
 */
function ajustarAlEspacio(
  ctx: CanvasRenderingContext2D,
  estrofas: string[][],
  anchoUtil: number,
  altoDisponible: number,
): { tamano: number; bloques: string[][]; altoTexto: number } {
  const versosOriginales = estrofas.reduce((total, estrofa) => total + estrofa.length, 0);

  const medir = (tamano: number) => {
    ctx.font = `${tamano}px ${FUENTE_SERIF}`;

    const bloques = estrofas.map((estrofa) =>
      estrofa.flatMap((verso) => ajustarTexto(ctx, verso, anchoUtil)),
    );

    const altoLinea = tamano * 1.55;
    const lineas = bloques.reduce((total, bloque) => total + bloque.length, 0);

    return {
      bloques,
      altoTexto: lineas * altoLinea + bloques.length * altoLinea * 0.55,
      // Si salieron mas lineas que versos, alguno se partio.
      versosEnteros: lineas === versosOriginales,
    };
  };

  // Primera pasada: el mayor tamaño con los versos enteros.
  for (let tamano = TAM_MAX; tamano >= TAM_MIN; tamano -= 2) {
    const { bloques, altoTexto, versosEnteros } = medir(tamano);

    if (versosEnteros && altoTexto <= altoDisponible) {
      return { tamano, bloques, altoTexto };
    }
  }

  // Segunda pasada: se acepta partir versos con tal de que entre completo.
  for (let tamano = TAM_MAX; tamano >= TAM_MIN; tamano -= 2) {
    const { bloques, altoTexto } = medir(tamano);

    if (altoTexto <= altoDisponible) {
      return { tamano, bloques, altoTexto };
    }
  }

  // No entra: se devuelve completo al mínimo y la ventana elige la parte.
  const { bloques, altoTexto } = medir(TAM_MIN);
  return { tamano: TAM_MIN, bloques, altoTexto };
}

/**
 * Parte un texto en las lineas que caben en `anchoMaximo`, cortando por
 * palabra. Devuelve al menos una linea aunque una sola palabra sea mas
 * larga que el ancho disponible.
 */
function ajustarTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  anchoMaximo: number,
): string[] {
  const palabras = texto.split(' ');
  const lineas: string[] = [];
  let actual = '';

  for (const palabra of palabras) {
    const tentativa = actual ? `${actual} ${palabra}` : palabra;

    if (ctx.measureText(tentativa).width <= anchoMaximo || !actual) {
      actual = tentativa;
    } else {
      lineas.push(actual);
      actual = palabra;
    }
  }

  if (actual) {
    lineas.push(actual);
  }

  return lineas;
}
