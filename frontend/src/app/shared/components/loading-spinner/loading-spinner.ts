import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador de carga, con el spinner propio de Bootstrap. */
@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{{ mensaje() }}</span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinner {
  readonly mensaje = input('Cargando');
}
