import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from '@angular/core';

import { urlDeImagen } from '../../../core/data/imagenes';
import { UploadsService, type CategoriaImagen } from '../../../core/services/uploads.service';

/** Proporcion de la vista previa segun donde se use la imagen. */
export type FormaVistaPrevia = 'ancha' | 'vertical';

/**
 * Campo para subir una imagen desde el panel: elegir archivo, ver la vista
 * previa y quitarla. La ruta resultante se refleja hacia afuera con `model`,
 * asi el formulario que lo usa solo tiene que enlazar su valor.
 */
@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUpload {
  private readonly uploads = inject(UploadsService);

  /** Ruta guardada de la imagen; vacia si todavia no hay ninguna. */
  readonly valor = model<string>('');

  readonly categoria = input.required<CategoriaImagen>();
  readonly etiqueta = input.required<string>();
  /** Guia de tamano y encuadre; se muestra debajo del campo. */
  readonly ayuda = input('');
  readonly forma = input<FormaVistaPrevia>('ancha');
  /** Fondo a mostrar cuando no hay imagen (ej: el degradado del poema). */
  readonly respaldo = input('');

  protected readonly subiendo = signal(false);
  protected readonly error = signal('');

  protected readonly idCampo = `imagen-${Math.random().toString(36).slice(2, 8)}`;

  protected readonly fondoVistaPrevia = computed(() => {
    const actual = this.valor();

    if (actual) {
      return `url('${urlDeImagen(actual)}')`;
    }

    return this.respaldo();
  });

  protected async alElegirArchivo(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    this.error.set('');

    // Se valida antes de enviar para no gastar una subida que el backend
    // va a rechazar igual.
    if (!this.uploads.tiposAceptados.includes(archivo.type)) {
      this.error.set('Solo se aceptan imágenes JPG, PNG o WebP.');
      input.value = '';
      return;
    }

    if (archivo.size > this.uploads.limiteBytes) {
      const mb = (archivo.size / (1024 * 1024)).toFixed(1);
      this.error.set(`La imagen pesa ${mb} MB y el máximo es 5 MB. Comprimila e intentá de nuevo.`);
      input.value = '';
      return;
    }

    this.subiendo.set(true);

    try {
      const anterior = this.valor();
      this.valor.set(await this.uploads.subir(archivo, this.categoria()));

      // Se borra la anterior recien cuando la nueva quedo guardada, para no
      // dejar el campo sin imagen si la subida falla.
      if (anterior) {
        void this.uploads.eliminar(anterior).catch(() => undefined);
      }
    } catch {
      this.error.set('No pudimos subir la imagen. Intentá de nuevo.');
    } finally {
      this.subiendo.set(false);
      // Permite volver a elegir el mismo archivo si hizo falta reintentar.
      input.value = '';
    }
  }

  protected async quitar(): Promise<void> {
    const actual = this.valor();

    if (!actual) {
      return;
    }

    this.valor.set('');
    // Si el borrado en el servidor falla, el campo ya quedo limpio igual:
    // lo unico que queda es un archivo huerfano, no un error para Santiago.
    void this.uploads.eliminar(actual).catch(() => undefined);
  }
}
