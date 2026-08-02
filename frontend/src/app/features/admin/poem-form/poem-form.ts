import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { degradadoPorSlug } from '../../../core/data/imagenes';
import { AlertasService } from '../../../core/services/alertas.service';
import { PoemsService } from '../../../core/services/poems.service';
import { ImageUpload } from '../../../shared/components/image-upload/image-upload';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { RichText } from '../../../shared/components/rich-text/rich-text';

/**
 * Formulario compartido para crear y editar poemas.
 * La ruta de edicion pasa el `id` como input; la de creacion lo deja vacio.
 */
@Component({
  selector: 'app-poem-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinner, ImageUpload, RichText],
  templateUrl: './poem-form.html',
  styleUrl: './poem-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly poemsService = inject(PoemsService);
  private readonly router = inject(Router);
  private readonly alertas = inject(AlertasService);

  readonly id = input<string>();

  protected readonly editando = computed(() => Boolean(this.id()));
  protected readonly guardando = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected readonly formulario = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    body: [''],
    coverImage: [''],
    published: [false],
    featured: [false],
    sortOrder: [0],
  });

  private readonly slugActual = signal('poema');

  /** Fondo que ve Santiago mientras el poema no tenga foto propia. */
  protected readonly degradado = computed(() => degradadoPorSlug(this.slugActual()));

  /** Enlaza el campo del formulario con el componente de subida. */
  protected get portada(): string {
    return this.formulario.controls.coverImage.value;
  }

  protected set portada(valor: string) {
    this.formulario.controls.coverImage.setValue(valor);
    this.formulario.markAsDirty();
  }

  async ngOnInit(): Promise<void> {
    const id = this.id();

    if (!id) {
      return;
    }

    this.cargando.set(true);

    try {
      const poema = await this.poemsService.obtenerPorId(id);
      this.slugActual.set(poema.slug);
      this.formulario.patchValue({
        title: poema.title,
        body: poema.body,
        coverImage: poema.coverImage,
        published: poema.published,
        featured: poema.featured,
        sortOrder: poema.sortOrder,
      });
    } catch {
      this.alertas.error('No pudimos cargar ese poema', 'Probá volver al listado y entrar de nuevo.');
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

    const datos = this.formulario.getRawValue();
    const id = this.id();

    try {
      if (id) {
        await this.poemsService.actualizar(id, datos);
      } else {
        await this.poemsService.crear(datos);
      }

      await this.router.navigate(['/admin/poemas']);
      this.alertas.exito(id ? 'Poema guardado' : 'Poema creado');
    } catch {
      this.alertas.error('No pudimos guardar el poema', 'Revisá los datos e intentá de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
}
