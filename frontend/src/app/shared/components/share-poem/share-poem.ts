import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import type { Poem } from '../../../core/models/poem.model';
import { ShareImageDialog, type DatosImagenPoema } from './share-image-dialog';

/**
 * Acciones para compartir un poema. Es la via por la que a Santiago le
 * llega el publico desde Instagram, asi que ademas de copiar el enlace
 * genera una imagen lista para publicar.
 */
@Component({
  selector: 'app-share-poem',
  imports: [],
  templateUrl: './share-poem.html',
  styleUrl: './share-poem.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharePoem {
  private readonly dialog = inject(Dialog);

  readonly poema = input.required<Poem>();
  readonly autor = input('santiago_a_secas__');

  protected readonly copiado = signal(false);
  protected readonly error = signal('');

  /** `navigator.share` solo existe en móviles y en algunos navegadores. */
  protected readonly puedeCompartirNativo =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  protected async copiarEnlace(): Promise<void> {
    this.error.set('');

    try {
      await navigator.clipboard.writeText(window.location.href);
      this.copiado.set(true);
      // El aviso vuelve a su estado normal solo, sin que haya que cerrarlo.
      setTimeout(() => this.copiado.set(false), 2500);
    } catch {
      this.error.set('No pudimos copiar el enlace. Copialo desde la barra del navegador.');
    }
  }

  protected async compartirNativo(): Promise<void> {
    this.error.set('');

    try {
      await navigator.share({
        title: this.poema().title,
        text: `"${this.poema().title}" — ${this.autor()}`,
        url: window.location.href,
      });
    } catch (err) {
      // Cancelar el diálogo del sistema lanza AbortError: no es un fallo.
      if (err instanceof Error && err.name !== 'AbortError') {
        this.error.set('No pudimos abrir el menú de compartir.');
      }
    }
  }

  /** Abre la vista previa, donde se elige el formato y se descarga. */
  protected abrirImagen(): void {
    this.error.set('');

    this.dialog.open<void, DatosImagenPoema>(ShareImageDialog, {
      ariaLabel: 'Imagen para compartir',
      data: { poema: this.poema(), autor: this.autor() },
    });
  }
}
