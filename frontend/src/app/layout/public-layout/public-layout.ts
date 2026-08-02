import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthorService } from '../../core/services/author.service';
import { SiteFooter } from '../site-footer/site-footer';
import { SiteHeader } from '../site-header/site-header';

/**
 * Envoltorio de todas las paginas publicas: cabecera, contenido y pie.
 * Carga los datos del autor una sola vez porque el pie los necesita
 * en cualquier ruta.
 */
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayout implements OnInit {
  private readonly authorService = inject(AuthorService);

  ngOnInit(): void {
    if (!this.authorService.autor()) {
      void this.authorService.cargar();
    }
  }
}
