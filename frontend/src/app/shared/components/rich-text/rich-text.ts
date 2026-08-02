import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Botones de la barra de formato. */
interface Accion {
  comando: string;
  etiqueta: string;
  titulo: string;
  /** Texto del botón con su propio formato aplicado, para que se entienda. */
  clase?: string;
}

/**
 * Editor de texto con formato.
 *
 * Se implementa sobre `contenteditable` y `execCommand`. El comando esta
 * marcado como obsoleto, pero sigue funcionando en todos los navegadores y
 * es la unica forma de hacer esto sin traer una libreria de 100 KB para
 * poner negrita y cursiva.
 *
 * El HTML que sale de aca NO se considera confiable: el backend lo vuelve a
 * limpiar con una lista blanca antes de guardarlo.
 */
@Component({
  selector: 'app-rich-text',
  imports: [],
  templateUrl: './rich-text.html',
  styleUrl: './rich-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichText),
      multi: true,
    },
  ],
})
export class RichText implements ControlValueAccessor {
  readonly etiqueta = input('');
  readonly ayuda = input('');
  readonly placeholder = input('Escribí acá...');
  /** Alto mínimo del área de escritura. */
  readonly alto = input('10rem');
  /** Clases extra para el área, por ejemplo la tipografía de poema. */
  readonly claseTexto = input('');

  private readonly area = viewChild.required<ElementRef<HTMLElement>>('area');

  protected readonly idCampo = `rico-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly deshabilitado = signal(false);
  protected readonly vacio = signal(true);

  protected readonly acciones: readonly Accion[] = [
    { comando: 'bold', etiqueta: 'N', titulo: 'Negrita', clase: 'fw-bold' },
    { comando: 'italic', etiqueta: 'C', titulo: 'Cursiva', clase: 'fst-italic' },
    { comando: 'underline', etiqueta: 'S', titulo: 'Subrayado', clase: 'text-decoration-underline' },
    {
      comando: 'strikeThrough',
      etiqueta: 'T',
      titulo: 'Tachado',
      clase: 'text-decoration-line-through',
    },
    { comando: 'insertUnorderedList', etiqueta: '•', titulo: 'Lista con viñetas' },
    { comando: 'insertOrderedList', etiqueta: '1.', titulo: 'Lista numerada' },
  ];

  private alCambiar: (valor: string) => void = () => undefined;
  private alTocar: () => void = () => undefined;

  // --- ControlValueAccessor ---

  writeValue(valor: string): void {
    const nodo = this.area().nativeElement;
    nodo.innerHTML = valor ?? '';
    this.vacio.set(this.estaVacio());
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }

  // --- Edición ---

  protected aplicar(comando: string): void {
    if (this.deshabilitado()) {
      return;
    }

    // El área tiene que tener el foco para que el comando sepa a qué
    // selección aplicarse.
    this.area().nativeElement.focus();
    document.execCommand(comando, false);
    this.emitir();
  }

  protected insertarEnlace(): void {
    if (this.deshabilitado()) {
      return;
    }

    const url = prompt('¿A qué dirección lleva el enlace?', 'https://');

    if (!url || url === 'https://') {
      return;
    }

    this.area().nativeElement.focus();
    document.execCommand('createLink', false, url);
    this.emitir();
  }

  protected quitarFormato(): void {
    if (this.deshabilitado()) {
      return;
    }

    this.area().nativeElement.focus();
    document.execCommand('removeFormat', false);
    document.execCommand('unlink', false);
    this.emitir();
  }

  protected alEscribir(): void {
    this.emitir();
  }

  protected alSalir(): void {
    this.alTocar();
  }

  /**
   * Pega siempre como texto plano.
   *
   * Copiar de Word o de una web trae HTML con estilos, fuentes y hasta
   * etiquetas que el backend va a descartar igual; pegarlo limpio evita
   * que el resultado se vea distinto de lo que quedó guardado.
   */
  protected alPegar(evento: ClipboardEvent): void {
    evento.preventDefault();

    const texto = evento.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, texto);
    this.emitir();
  }

  private emitir(): void {
    const nodo = this.area().nativeElement;
    this.vacio.set(this.estaVacio());
    // Si solo quedó el andamiaje vacío del navegador, se guarda vacío.
    this.alCambiar(this.estaVacio() ? '' : nodo.innerHTML);
  }

  private estaVacio(): boolean {
    const nodo = this.area().nativeElement;
    return (nodo.textContent ?? '').trim().length === 0 && !nodo.querySelector('img');
  }
}
