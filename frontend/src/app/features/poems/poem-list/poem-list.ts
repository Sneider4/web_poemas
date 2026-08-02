import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { PoemsService } from '../../../core/services/poems.service';
import { SeoService } from '../../../core/services/seo.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { PoemCard } from '../../../shared/components/poem-card/poem-card';
import { Reveal } from '../../../shared/directives/reveal';

/** Marcas de tilde que deja `normalize('NFD')` al separarlas de su letra. */
const DIACRITICOS = /[̀-ͯ]/g;

/** Deja el texto comparable: sin mayusculas ni tildes. */
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(DIACRITICOS, '');
}

@Component({
  selector: 'app-poem-list',
  imports: [PoemCard, EmptyState, LoadingSpinner, Reveal],
  templateUrl: './poem-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemList implements OnInit {
  private readonly poemsService = inject(PoemsService);
  private readonly seo = inject(SeoService);

  protected readonly poemas = this.poemsService.poemas;
  protected readonly cargando = this.poemsService.cargando;

  protected readonly busqueda = signal('');

  /**
   * Filtra por titulo ignorando mayusculas y tildes, para que "adios"
   * encuentre "adiós" y "MAMA" encuentre "el viejo televisor de mamá".
   */
  protected readonly resultados = computed(() => {
    const termino = normalizar(this.busqueda().trim());

    if (!termino) {
      return this.poemas();
    }

    return this.poemas().filter((poema) => normalizar(poema.title).includes(termino));
  });

  protected readonly buscando = computed(() => this.busqueda().trim().length > 0);

  ngOnInit(): void {
    void this.poemsService.cargarPublicos();
    this.seo.aplicarPagina(
      'Poemas',
      'Todos los poemas de Santiago, en un solo lugar.',
      '/poemas',
    );
  }

  protected alBuscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected limpiar(): void {
    this.busqueda.set('');
  }
}
