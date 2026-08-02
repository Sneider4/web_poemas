import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Poem } from '../../../core/models/poem.model';
import { AlertasService } from '../../../core/services/alertas.service';
import { PoemsService } from '../../../core/services/poems.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-poems-manager',
  imports: [RouterLink, LoadingSpinner],
  // Sin estilos propios: tabla, botones y badges son de Bootstrap.
  templateUrl: './poems-manager.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemsManager implements OnInit {
  private readonly poemsService = inject(PoemsService);
  private readonly alertas = inject(AlertasService);

  protected readonly poemas = this.poemsService.todos;
  protected readonly cargando = this.poemsService.cargando;

  protected readonly publicados = computed(
    () => this.poemas().filter((poema) => poema.published).length,
  );

  ngOnInit(): void {
    void this.poemsService.cargarTodos();
  }

  /** Publica o despublica sin salir del listado. */
  protected async alternarPublicado(poema: Poem): Promise<void> {
    try {
      await this.poemsService.actualizar(poema.id, { published: !poema.published });
      this.alertas.exito(poema.published ? 'Poema despublicado' : 'Poema publicado');
    } catch {
      this.alertas.error('No pudimos actualizarlo', `Quedó sin cambios "${poema.title}".`);
    }
  }

  protected async alternarDestacado(poema: Poem): Promise<void> {
    try {
      await this.poemsService.actualizar(poema.id, { featured: !poema.featured });
      this.alertas.exito(poema.featured ? 'Ya no está destacado' : 'Marcado como destacado');
    } catch {
      this.alertas.error('No pudimos actualizarlo', `Quedó sin cambios "${poema.title}".`);
    }
  }

  protected async eliminar(poema: Poem): Promise<void> {
    const confirmado = await this.alertas.confirmarEliminacion(
      `¿Eliminar "${poema.title}"?`,
      'El poema se borra definitivamente. Esta acción no se puede deshacer.',
    );

    if (!confirmado) {
      return;
    }

    try {
      await this.poemsService.eliminar(poema.id);
      this.alertas.exito('Poema eliminado');
    } catch {
      this.alertas.error('No pudimos eliminarlo', `"${poema.title}" sigue publicado.`);
    }
  }
}
