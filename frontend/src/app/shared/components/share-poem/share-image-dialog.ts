import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';

import type { Poem } from '../../../core/models/poem.model';
import {
  FORMATOS,
  calcularDisposicion,
  generarImagenDelPoema,
  type FormatoImagen,
} from './historia-canvas';

export interface DatosImagenPoema {
  poema: Poem;
  autor: string;
}

/**
 * Vista previa de la imagen antes de descargarla.
 *
 * Cuando el poema no entra completo, se elige que parte se muestra
 * moviendo una ventana sobre el texto: se arrastra dentro del recuadro,
 * con la rueda o con el control deslizante. La imagen que se descarga es
 * exactamente lo que se ve.
 */
@Component({
  selector: 'app-share-image-dialog',
  imports: [],
  templateUrl: './share-image-dialog.html',
  styleUrl: './share-image-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareImageDialog implements OnDestroy {
  private readonly dialogRef = inject(DialogRef<void>);
  protected readonly datos = inject<DatosImagenPoema>(DIALOG_DATA);

  protected readonly formatos = [
    { valor: 'historia' as const, etiqueta: 'Historia', proporcion: '9:16' },
    { valor: 'publicacion' as const, etiqueta: 'Publicación', proporcion: '4:5' },
  ];

  protected readonly formato = signal<FormatoImagen>('historia');
  protected readonly generando = signal(false);
  protected readonly error = signal('');
  protected readonly vistaPrevia = signal('');

  /** Posición de la ventana sobre el poema, en píxeles del lienzo. */
  protected readonly desplazamiento = signal(0);

  /** Cuánto se puede mover. Cero = el poema entra completo. */
  protected readonly maximo = computed(
    () =>
      calcularDisposicion(this.datos.poema.title, this.datos.poema.body, this.formato())
        .desplazamientoMaximo,
  );

  protected readonly sePuedeMover = computed(() => this.maximo() > 0);

  /** Porcentaje recorrido, para el indicador. */
  protected readonly avance = computed(() =>
    this.maximo() === 0 ? 100 : Math.round((this.desplazamiento() / this.maximo()) * 100),
  );

  private blobActual: Blob | null = null;
  /** Se conserva para poder liberarla: si no, queda retenida en memoria. */
  private urlActual = '';
  private cuadroPendiente = 0;

  // Estado del arrastre.
  private arrastrando = false;
  private yInicial = 0;
  private desplazamientoInicial = 0;
  /** Alto en pantalla del recuadro, para convertir píxeles de pantalla a lienzo. */
  private altoEnPantalla = 1;

  constructor() {
    void this.generar();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.cuadroPendiente);
    this.liberarUrl();
  }

  // --- Mover la ventana ---

  protected alPresionar(evento: PointerEvent): void {
    if (!this.sePuedeMover()) {
      return;
    }

    const recuadro = evento.currentTarget as HTMLElement;
    recuadro.setPointerCapture(evento.pointerId);

    this.arrastrando = true;
    this.yInicial = evento.clientY;
    this.desplazamientoInicial = this.desplazamiento();
    this.altoEnPantalla = recuadro.getBoundingClientRect().height || 1;
  }

  protected alMover(evento: PointerEvent): void {
    if (!this.arrastrando) {
      return;
    }

    evento.preventDefault();

    // Se convierte el arrastre en pantalla a píxeles del lienzo.
    const escala = FORMATOS[this.formato()].alto / this.altoEnPantalla;
    // Arrastrar hacia arriba avanza en el poema, como en cualquier scroll.
    const delta = (this.yInicial - evento.clientY) * escala;

    this.fijarDesplazamiento(this.desplazamientoInicial + delta);
  }

  protected alSoltar(evento: PointerEvent): void {
    if (!this.arrastrando) {
      return;
    }

    (evento.currentTarget as HTMLElement).releasePointerCapture(evento.pointerId);
    this.arrastrando = false;
  }

  protected alRodar(evento: WheelEvent): void {
    if (!this.sePuedeMover()) {
      return;
    }

    evento.preventDefault();
    this.fijarDesplazamiento(this.desplazamiento() + evento.deltaY * 1.5);
  }

  protected alDeslizar(evento: Event): void {
    const valor = Number((evento.target as HTMLInputElement).value);
    this.fijarDesplazamiento((valor / 100) * this.maximo());
  }

  protected volverAlInicio(): void {
    this.fijarDesplazamiento(0);
  }

  private fijarDesplazamiento(valor: number): void {
    const acotado = Math.min(Math.max(0, valor), this.maximo());

    if (acotado === this.desplazamiento()) {
      return;
    }

    this.desplazamiento.set(acotado);

    // Se redibuja como mucho una vez por cuadro: arrastrar dispara muchos
    // eventos por segundo y regenerar en todos trabaría el arrastre.
    cancelAnimationFrame(this.cuadroPendiente);
    this.cuadroPendiente = requestAnimationFrame(() => void this.generar());
  }

  // --- Formato y descarga ---

  protected async cambiarFormato(valor: FormatoImagen): Promise<void> {
    if (valor === this.formato()) {
      return;
    }

    this.formato.set(valor);
    // El otro formato tiene otro alto: el desplazamiento se reajusta.
    this.desplazamiento.set(Math.min(this.desplazamiento(), this.maximo()));

    await this.generar();
  }

  protected descargar(): void {
    if (!this.blobActual) {
      return;
    }

    const enlace = document.createElement('a');
    enlace.href = this.urlActual;
    enlace.download = `${this.datos.poema.slug}-${this.formato()}.png`;
    enlace.click();

    this.dialogRef.close();
  }

  protected cerrar(): void {
    this.dialogRef.close();
  }

  /** Proporción del recuadro de vista previa, según el formato elegido. */
  protected get proporcion(): string {
    const { ancho, alto } = FORMATOS[this.formato()];
    return `${ancho} / ${alto}`;
  }

  private async generar(): Promise<void> {
    this.generando.set(true);
    this.error.set('');

    try {
      this.blobActual = await generarImagenDelPoema(
        this.datos.poema,
        this.datos.autor,
        this.formato(),
        this.desplazamiento(),
      );

      this.liberarUrl();
      this.urlActual = URL.createObjectURL(this.blobActual);
      this.vistaPrevia.set(this.urlActual);
    } catch {
      this.error.set('No pudimos generar la imagen.');
    } finally {
      this.generando.set(false);
    }
  }

  private liberarUrl(): void {
    if (this.urlActual) {
      URL.revokeObjectURL(this.urlActual);
      this.urlActual = '';
    }
  }
}
