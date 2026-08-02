import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import {
  TIPOS_PUBLICACION,
  type CommunityPost,
} from '../../../core/models/community-post.model';
import { AlertasService } from '../../../core/services/alertas.service';
import { CommunityService } from '../../../core/services/community.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-community-moderation',
  imports: [DatePipe, LoadingSpinner],
  // Sin estilos propios: todo se resuelve con utilidades de Bootstrap.
  templateUrl: './community-moderation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityModeration implements OnInit {
  private readonly communityService = inject(CommunityService);
  private readonly alertas = inject(AlertasService);

  protected readonly publicaciones = this.communityService.publicaciones;
  protected readonly cargando = this.communityService.cargando;

  ngOnInit(): void {
    void this.communityService.cargarTodas();
  }

  protected etiquetaTipo(post: CommunityPost): string {
    return TIPOS_PUBLICACION.find((tipo) => tipo.value === post.type)?.label ?? post.type;
  }

  /** Ocultar es reversible; por eso se prefiere sobre eliminar. */
  protected async alternarVisibilidad(post: CommunityPost): Promise<void> {
    try {
      await this.communityService.moderar(post.id, !post.hidden);
      this.alertas.exito(post.hidden ? 'Publicación visible de nuevo' : 'Publicación oculta');
    } catch {
      this.alertas.error('No pudimos cambiar la visibilidad', 'Intentá de nuevo en un momento.');
    }
  }

  protected async eliminar(post: CommunityPost): Promise<void> {
    const confirmado = await this.alertas.confirmarEliminacion(
      `¿Eliminar la publicación de ${post.authorName}?`,
      'Se borra definitivamente. Si solo querés sacarla del sitio, usá "Ocultar", que se puede revertir.',
    );

    if (!confirmado) {
      return;
    }

    try {
      await this.communityService.eliminar(post.id);
      this.alertas.exito('Publicación eliminada');
    } catch {
      this.alertas.error('No pudimos eliminarla', 'Intentá de nuevo en un momento.');
    }
  }
}
