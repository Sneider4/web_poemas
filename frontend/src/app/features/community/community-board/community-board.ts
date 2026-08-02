import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import type { CommunityPostInput } from '../../../core/models/community-post.model';
import { CommunityService } from '../../../core/services/community.service';
import { SeoService } from '../../../core/services/seo.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { CommunityPostCard } from '../community-post-card/community-post-card';
import { NewPostDialog } from '../new-post-dialog/new-post-dialog';

@Component({
  selector: 'app-community-board',
  imports: [CommunityPostCard, EmptyState, LoadingSpinner],
  templateUrl: './community-board.html',
  styleUrl: './community-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityBoard implements OnInit {
  private readonly communityService = inject(CommunityService);
  private readonly dialog = inject(Dialog);
  private readonly seo = inject(SeoService);

  protected readonly publicaciones = this.communityService.publicaciones;
  protected readonly cargando = this.communityService.cargando;
  protected readonly error = signal('');

  ngOnInit(): void {
    void this.communityService.cargar();
    this.seo.aplicarPagina(
      'Comunidad',
      'Publicá un poema, tu opinión o la música que te acompaña, y calificá lo que escribieron los demás.',
      '/comunidad',
    );
  }

  protected yaCalifico(postId: string): boolean {
    return this.communityService.yaCalifico(postId);
  }

  /**
   * Abre el formulario. Se invoca desde el boton "+" y desde el doble clic
   * sobre el tablero, replicando la interaccion del sitio original.
   */
  protected abrirFormulario(): void {
    const referencia = this.dialog.open<CommunityPostInput | undefined>(NewPostDialog, {
      ariaLabel: 'Publicar en la comunidad',
    });

    referencia.closed.subscribe((datos) => {
      if (datos) {
        void this.publicar(datos);
      }
    });
  }

  /** El doble clic solo cuenta sobre el fondo, no sobre una tarjeta. */
  protected alDobleClic(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) {
      this.abrirFormulario();
    }
  }

  protected async calificar(postId: string): Promise<void> {
    try {
      await this.communityService.alternarCalificacion(postId);
    } catch {
      this.error.set('No pudimos registrar tu me gusta. Intentá de nuevo.');
    }
  }

  private async publicar(datos: CommunityPostInput): Promise<void> {
    this.error.set('');

    try {
      await this.communityService.publicar(datos);
    } catch {
      this.error.set(
        'No pudimos publicar tu mensaje. Puede que hayas publicado demasiado seguido; esperá unos minutos.',
      );
    }
  }
}
