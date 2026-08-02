import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Mensaje reutilizable para listados vacios. */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly titulo = input.required<string>();
  readonly detalle = input('');
}
