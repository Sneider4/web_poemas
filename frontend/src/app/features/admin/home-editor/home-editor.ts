import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AlertasService } from '../../../core/services/alertas.service';
import { AuthorService } from '../../../core/services/author.service';
import { ImageUpload } from '../../../shared/components/image-upload/image-upload';
import { RichText } from '../../../shared/components/rich-text/rich-text';

/**
 * Textos e imagen de la pagina principal.
 *
 * Estos campos viven en el mismo registro que los del autor, pero se editan
 * aparte porque son otra cosa: lo que ve alguien al entrar al sitio. El
 * guardado es parcial, asi que no pisa los datos de la pantalla "Autor".
 */
@Component({
  selector: 'app-home-editor',
  imports: [ReactiveFormsModule, ImageUpload, RichText],
  // Sin estilos propios: todo se resuelve con utilidades de Bootstrap.
  templateUrl: './home-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeEditor implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authorService = inject(AuthorService);
  private readonly alertas = inject(AlertasService);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    heroImage: ['', Validators.maxLength(300)],
    heroEyebrow: ['', Validators.maxLength(120)],
    heroVerse: ['', Validators.maxLength(400)],
    manifesto: ['', Validators.maxLength(500)],
    manifestoNote: ['', Validators.maxLength(800)],
  });

  /** Enlaza el campo del formulario con el componente de subida. */
  protected get fondoPortada(): string {
    return this.formulario.controls.heroImage.value;
  }

  protected set fondoPortada(valor: string) {
    this.formulario.controls.heroImage.setValue(valor);
    this.formulario.markAsDirty();
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.authorService.cargar();

      const autor = this.authorService.autor();

      if (autor) {
        this.formulario.patchValue({
          heroImage: autor.heroImage,
          heroEyebrow: autor.heroEyebrow,
          heroVerse: autor.heroVerse,
          manifesto: autor.manifesto,
          manifestoNote: autor.manifestoNote,
        });
      }
    } finally {
      this.cargando.set(false);
    }
  }

  protected async guardar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);

    try {
      await this.authorService.actualizar(this.formulario.getRawValue());
      this.alertas.exito('Página principal actualizada');
    } catch {
      this.alertas.error('No pudimos guardar los cambios', 'Revisá los datos e intentá de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
}
