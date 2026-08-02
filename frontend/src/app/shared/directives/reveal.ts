import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';

/**
 * Revela el elemento cuando entra en pantalla: sube unos pixeles y aparece.
 *
 * El elemento arranca visible en el HTML y es la directiva la que lo oculta.
 * Asi, si el navegador no soporta IntersectionObserver o algo falla, el
 * contenido se ve igual en vez de quedar invisible para siempre. Por lo
 * mismo el trabajo va en `afterNextRender`, que no corre en el servidor: lo
 * que se renderiza alla queda visible y sin depender de JavaScript.
 *
 * Uso:
 *   <section appReveal>...</section>
 *   <div appReveal [revealDelay]="120">...</div>
 */
@Directive({
  selector: '[appReveal]',
})
export class Reveal implements OnDestroy {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Retardo en milisegundos, para escalonar varios elementos seguidos. */
  readonly revealDelay = input(0);

  private observador?: IntersectionObserver;

  constructor() {
    afterNextRender(() => this.preparar());
  }

  private preparar(): void {
    const nodo = this.elemento.nativeElement;

    // Si la persona pidió menos movimiento, no se anima nada.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Lo que ya se ve al llegar se deja como esta. Con SSR ese contenido
    // viene visible desde el servidor, y ocultarlo para animarlo produce un
    // parpadeo justo donde la persona esta mirando.
    if (nodo.getBoundingClientRect().top < window.innerHeight) {
      return;
    }

    nodo.classList.add('por-revelar');

    if (this.revealDelay() > 0) {
      nodo.style.transitionDelay = `${this.revealDelay()}ms`;
    }

    this.observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            nodo.classList.add('revelado');
            // Una sola vez: al volver a subir no se esconde de nuevo.
            this.observador?.disconnect();
          }
        }
      },
      // Sin margen negativo: en cuanto una parte del elemento entra en
      // pantalla se revela. Retenerlo un poco más se veía más prolijo,
      // pero dejaba un fragmento de poema en blanco al pie de la pantalla.
      { threshold: 0.08 },
    );

    this.observador.observe(nodo);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
