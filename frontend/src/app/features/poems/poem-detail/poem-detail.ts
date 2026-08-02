import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fondoDePoema } from '../../../core/data/imagenes';
import type { Poem } from '../../../core/models/poem.model';
import { AuthorService } from '../../../core/services/author.service';
import { PoemsService } from '../../../core/services/poems.service';
import { SeoService } from '../../../core/services/seo.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { SharePoem } from '../../../shared/components/share-poem/share-poem';
import { Reveal } from '../../../shared/directives/reveal';
import { aTextoPlano } from '../../../shared/utils/texto-plano';
import { PoemBar } from '../poem-bar/poem-bar';

@Component({
  selector: 'app-poem-detail',
  imports: [DatePipe, RouterLink, LoadingSpinner, SharePoem, PoemBar, Reveal],
  templateUrl: './poem-detail.html',
  styleUrl: './poem-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemDetail {
  private readonly poemsService = inject(PoemsService);
  private readonly authorService = inject(AuthorService);
  private readonly seo = inject(SeoService);

  /** Llega desde la ruta gracias a `withComponentInputBinding()`. */
  readonly slug = input.required<string>();

  protected readonly poema = signal<Poem | null>(null);
  protected readonly cargando = signal(true);
  protected readonly noEncontrado = signal(false);

  protected readonly autor = this.authorService.autor;

  protected readonly fondo = computed(() => {
    const actual = this.poema();
    return actual ? fondoDePoema(actual.coverImage, actual.slug) : '';
  });

  /** Fondo de otro poema, para las miniaturas de anterior y siguiente. */
  protected fondoDe(poema: Poem): string {
    return fondoDePoema(poema.coverImage, poema.slug);
  }

  /**
   * Primeros versos de otro poema, como adelanto en su tarjeta.
   * Sin formato: en un espacio tan chico las etiquetas estorban.
   */
  protected adelantoDe(poema: Poem): string {
    return aTextoPlano(poema.body)
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join('\n');
  }

  /**
   * Poemas anterior y siguiente segun el orden del indice publico, para
   * poder seguir leyendo sin volver al listado.
   */
  private readonly indice = computed(() => {
    const actual = this.poema();
    const lista = this.poemsService.poemas();

    if (!actual || lista.length === 0) {
      return -1;
    }

    return lista.findIndex((p) => p.id === actual.id);
  });

  protected readonly anterior = computed(() => {
    const i = this.indice();
    return i > 0 ? this.poemsService.poemas()[i - 1] : null;
  });

  protected readonly siguiente = computed(() => {
    const i = this.indice();
    const lista = this.poemsService.poemas();
    return i >= 0 && i < lista.length - 1 ? lista[i + 1] : null;
  });

  constructor() {
    // Al navegar de un poema a otro el componente se reutiliza y solo
    // cambia el input: el effect vuelve a cargar el contenido.
    effect(() => void this.cargar(this.slug()));

    // La lista completa alimenta la navegación anterior/siguiente y el
    // autor alimenta la firma al compartir; se piden una sola vez.
    if (this.poemsService.poemas().length === 0) {
      void this.poemsService.cargarPublicos();
    }

    if (!this.authorService.autor()) {
      void this.authorService.cargar();
    }
  }

  private async cargar(slug: string): Promise<void> {
    this.cargando.set(true);
    this.noEncontrado.set(false);

    try {
      const poema = await this.poemsService.obtenerPorSlug(slug);
      this.poema.set(poema);

      // Titulo, adelanto y foto de ESTE poema. Como corre tambien en el
      // servidor, quien comparta el enlace ve la tarjeta del poema y no
      // una generica del sitio.
      this.seo.aplicarPoema(poema);
    } catch {
      this.poema.set(null);
      this.noEncontrado.set(true);
      this.seo.aplicarPagina(
        'Poema no encontrado',
        'Ese poema no existe o todavía no está publicado.',
        `/poemas/${slug}`,
      );
    } finally {
      this.cargando.set(false);
    }
  }
}
