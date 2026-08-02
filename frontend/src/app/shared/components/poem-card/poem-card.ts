import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fondoDePoema } from '../../../core/data/imagenes';
import type { Poem } from '../../../core/models/poem.model';
import { aTextoPlano } from '../../utils/texto-plano';

/**
 * Pieza de la galeria de poemas: la foto (o su degradado de respaldo) con
 * el titulo encima y un adelanto de los primeros versos.
 */
@Component({
  selector: 'app-poem-card',
  imports: [RouterLink],
  templateUrl: './poem-card.html',
  styleUrl: './poem-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemCard {
  readonly poema = input.required<Poem>();

  /** Foto del poema o, si no tiene, el degradado derivado de su slug. */
  protected readonly fondo = computed(() =>
    fondoDePoema(this.poema().coverImage, this.poema().slug),
  );

  /**
   * Primeros versos como adelanto, saltando las lineas en blanco.
   * Sin formato: en la tarjeta el texto se recorta y las etiquetas
   * cortadas a la mitad se verian mal.
   */
  protected readonly adelanto = computed(() => {
    const versos = aTextoPlano(this.poema().body)
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean);

    return versos.slice(0, 2).join('\n');
  });
}
