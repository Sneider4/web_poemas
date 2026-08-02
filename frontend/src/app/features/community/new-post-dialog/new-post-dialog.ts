import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  LIMITES_PUBLICACION,
  TIPOS_PUBLICACION,
  type CommunityPostInput,
} from '../../../core/models/community-post.model';
import { RichText } from '../../../shared/components/rich-text/rich-text';
import { aTextoPlano } from '../../../shared/utils/texto-plano';

/**
 * Formulario para publicar en el tablero. Se abre desde el boton "+"
 * o con doble clic sobre el tablero, igual que en el sitio original.
 */
@Component({
  selector: 'app-new-post-dialog',
  imports: [ReactiveFormsModule, RichText],
  templateUrl: './new-post-dialog.html',
  styleUrl: './new-post-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPostDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject<DialogRef<CommunityPostInput | undefined>>(DialogRef);

  protected readonly tipos = TIPOS_PUBLICACION;
  protected readonly limites = LIMITES_PUBLICACION;
  protected readonly enviando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    authorName: ['', [Validators.required, Validators.maxLength(LIMITES_PUBLICACION.nombre)]],
    type: ['POEM' as const, Validators.required],
    content: ['', Validators.required],
    // Honeypot: oculto por CSS. Si un bot lo rellena, el backend rechaza el envio.
    website: [''],
  });

  /** Largo del contenido sin las etiquetas de formato. */
  private readonly largoReal = signal(0);

  protected readonly restantes = computed(
    () => LIMITES_PUBLICACION.contenido - this.largoReal(),
  );

  protected readonly seExcedio = computed(() => this.restantes() < 0);

  constructor() {
    // Se mide el texto plano y no el HTML: contando las etiquetas, unas
    // pocas palabras con formato ya se pasarian del limite.
    this.formulario.controls.content.valueChanges.subscribe((valor) =>
      this.largoReal.set(aTextoPlano(valor ?? '').length),
    );
  }

  protected enviar(): void {
    if (this.formulario.invalid || this.seExcedio()) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.dialogRef.close(this.formulario.getRawValue() as CommunityPostInput);
  }

  protected cancelar(): void {
    this.dialogRef.close(undefined);
  }
}
