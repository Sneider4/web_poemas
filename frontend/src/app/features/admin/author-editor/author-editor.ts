import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AlertasService } from '../../../core/services/alertas.service';
import { AuthorService } from '../../../core/services/author.service';
import { ImageUpload } from '../../../shared/components/image-upload/image-upload';
import { RichText } from '../../../shared/components/rich-text/rich-text';

/**
 * Datos de la pagina "Autor". Los textos de la portada se editan aparte,
 * en `home-editor`; el guardado es parcial y no los pisa.
 */
@Component({
  selector: 'app-author-editor',
  imports: [ReactiveFormsModule, ImageUpload, RichText],
  templateUrl: './author-editor.html',
  styleUrl: './author-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorEditor implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authorService = inject(AuthorService);
  private readonly alertas = inject(AlertasService);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    tagline: ['', Validators.maxLength(200)],
    bio: ['', [Validators.required, Validators.maxLength(5000)]],
    instagram: ['', Validators.maxLength(100)],
    photo: ['', Validators.maxLength(300)],
  });

  /** Enlaza el campo del formulario con el componente de subida. */
  protected get retrato(): string {
    return this.formulario.controls.photo.value;
  }

  protected set retrato(valor: string) {
    this.formulario.controls.photo.setValue(valor);
    this.formulario.markAsDirty();
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.authorService.cargar();

      const autor = this.authorService.autor();

      if (autor) {
        this.formulario.patchValue({
          name: autor.name,
          tagline: autor.tagline,
          bio: autor.bio,
          instagram: autor.instagram,
          photo: autor.photo,
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
      this.alertas.exito('Datos actualizados');
    } catch {
      this.alertas.error('No pudimos guardar los cambios', 'Revisá los datos e intentá de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
}
