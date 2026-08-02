import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { aTextoPlano } from '../../shared/utils/texto-plano';
import { urlDeImagen } from '../data/imagenes';
import type { Poem } from '../models/poem.model';

const NOMBRE_SITIO = 'Santiago a secas';

/** Imagen que se muestra cuando lo compartido no tiene foto propia. */
const IMAGEN_POR_DEFECTO = `${environment.siteUrl}/og-imagen.png`;

/** Largo maximo de la descripcion: mas alla WhatsApp y Twitter la cortan. */
const MAX_DESCRIPCION = 200;

interface DatosPagina {
  /** Lo que se ve en la pestaña del navegador. */
  titulo: string;
  /** Lo que se ve en la tarjeta al compartir, sin el sufijo del sitio. */
  tituloSocial: string;
  descripcion: string;
  imagen: string;
  ruta: string;
  tipo: 'website' | 'article';
}

/**
 * Escribe los meta tags de cada pagina.
 *
 * Importa que esto corra tambien en el servidor: los previsualizadores de
 * WhatsApp, Instagram, Facebook y Twitter leen el HTML tal como llega y no
 * ejecutan JavaScript. Sin renderizado en servidor todos los enlaces
 * compartidos mostrarian la misma tarjeta generica.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly doc = inject(DOCUMENT);

  /** Meta tags de un poema concreto. */
  aplicarPoema(poema: Poem): void {
    this.aplicar({
      titulo: `${poema.title} | ${NOMBRE_SITIO}`,
      tituloSocial: poema.title,
      descripcion: this.adelanto(poema.body),
      imagen: poema.coverImage ? urlDeImagen(poema.coverImage) : IMAGEN_POR_DEFECTO,
      ruta: `/poemas/${poema.slug}`,
      tipo: 'article',
    });
  }

  /** Meta tags de la portada, que lleva el nombre del sitio sin sufijo. */
  aplicarInicio(descripcion: string): void {
    this.aplicar({
      titulo: `${NOMBRE_SITIO} | Poemas de un solitario para otro solitario`,
      tituloSocial: NOMBRE_SITIO,
      descripcion,
      imagen: IMAGEN_POR_DEFECTO,
      ruta: '/',
      tipo: 'website',
    });
  }

  /** Meta tags de una pagina que no es un poema. */
  aplicarPagina(titulo: string, descripcion: string, ruta: string): void {
    this.aplicar({
      titulo: `${titulo} | ${NOMBRE_SITIO}`,
      tituloSocial: titulo,
      descripcion,
      imagen: IMAGEN_POR_DEFECTO,
      ruta,
      tipo: 'website',
    });
  }

  private aplicar(datos: DatosPagina): void {
    const url = `${environment.siteUrl}${datos.ruta}`;

    this.title.setTitle(datos.titulo);

    // `updateTag` reemplaza el tag si ya existe: al navegar de un poema a
    // otro no se acumulan etiquetas viejas.
    this.meta.updateTag({ name: 'description', content: datos.descripcion });
    this.meta.updateTag({ property: 'og:type', content: datos.tipo });
    this.meta.updateTag({ property: 'og:title', content: datos.tituloSocial });
    this.meta.updateTag({ property: 'og:description', content: datos.descripcion });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:site_name', content: NOMBRE_SITIO });
    this.meta.updateTag({ property: 'og:image', content: datos.imagen });

    // Twitter se apoya en las etiquetas og; solo elige la forma de la tarjeta.
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.canonico(url);
  }

  /**
   * Un poema puede llegar por varias direcciones (con los parametros utm de
   * Instagram, por ejemplo); el canonico le dice al buscador cual es la buena.
   */
  private canonico(url: string): void {
    let enlace = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!enlace) {
      enlace = this.doc.createElement('link');
      enlace.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(enlace);
    }

    enlace.setAttribute('href', url);
  }

  /** Primeros versos como descripcion, sin formato y sin cortar palabras. */
  private adelanto(cuerpo: string): string {
    const texto = aTextoPlano(cuerpo).replace(/\s+/g, ' ').trim();

    if (texto.length <= MAX_DESCRIPCION) {
      return texto;
    }

    const recortado = texto.slice(0, MAX_DESCRIPCION);
    return `${recortado.slice(0, recortado.lastIndexOf(' '))}…`;
  }
}
