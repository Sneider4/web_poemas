import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  afterNextRender,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Poem } from '../../../core/models/poem.model';

/**
 * Franja que aparece al pasar la cabecera del poema.
 *
 * Recuerda que poema se esta leyendo cuando el titulo grande ya quedo
 * arriba, y de paso muestra cuanto falta: la barra de progreso va
 * integrada en su borde inferior, para no apilar dos barras distintas.
 */
@Component({
  selector: 'app-poem-bar',
  imports: [RouterLink],
  templateUrl: './poem-bar.html',
  styleUrl: './poem-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemBar {
  readonly poema = input.required<Poem>();
  readonly anterior = input<Poem | null>(null);
  readonly siguiente = input<Poem | null>(null);

  protected readonly Math = Math;

  /** Desplazamiento a partir del cual la franja se muestra. */
  private readonly umbral = 240;

  protected readonly desplazamiento = signal(0);
  protected readonly progreso = signal(0);
  /** Alto de la cabecera del sitio: la franja se acomoda justo debajo. */
  protected readonly alturaCabecera = signal(72);

  protected readonly visible = computed(() => this.desplazamiento() > this.umbral);

  constructor() {
    // Medir exige el DOM real: solo corre en el navegador, nunca al
    // renderizar en el servidor.
    afterNextRender(() => this.medirCabecera());
  }

  @HostListener('window:scroll')
  protected alDesplazar(): void {
    this.desplazamiento.set(window.scrollY);

    const alto = document.documentElement.scrollHeight - window.innerHeight;
    this.progreso.set(alto <= 0 ? 0 : Math.min(100, Math.max(0, (window.scrollY / alto) * 100)));
  }

  @HostListener('window:resize')
  protected medirCabecera(): void {
    // Se mide en vez de fijarla: en móvil la cabecera es más baja y con
    // un valor fijo la franja quedaría despegada o encimada.
    const cabecera = document.querySelector('app-site-header');

    if (cabecera) {
      this.alturaCabecera.set(Math.round(cabecera.getBoundingClientRect().height));
    }

    this.alDesplazar();
  }
}
