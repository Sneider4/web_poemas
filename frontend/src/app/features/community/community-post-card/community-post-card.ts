import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  TIPOS_PUBLICACION,
  type CommunityPost,
} from '../../../core/models/community-post.model';

@Component({
  selector: 'app-community-post-card',
  imports: [DatePipe],
  // Sin estilos propios: la tarjeta es la de Bootstrap.
  templateUrl: './community-post-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityPostCard {
  readonly post = input.required<CommunityPost>();
  readonly yaCalifico = input(false);

  readonly calificar = output<string>();

  protected readonly etiquetaTipo = computed(
    () => TIPOS_PUBLICACION.find((tipo) => tipo.value === this.post().type)?.label ?? '',
  );

  /** Un solo botón que pone o quita el me gusta según el estado actual. */
  protected alCalificar(): void {
    this.calificar.emit(this.post().id);
  }
}
