import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthorService } from '../../core/services/author.service';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  // Sin estilos propios: todo el pie se resuelve con utilidades de Bootstrap.
  templateUrl: './site-footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  private readonly authorService = inject(AuthorService);

  protected readonly autor = this.authorService.autor;
  protected readonly anio = new Date().getFullYear();

  /** Créditos de quien desarrolló el sitio. */
  protected readonly desarrollador = {
    nombre: 'Richard Sneider Malagón Conde',
    rol: 'Fullstack Developer',
    portafolio: 'https://sneider4.github.io/portfolio/',
    // El portafolio no se repite acá: el nombre ya enlaza a él.
    enlaces: [
      { etiqueta: 'GitHub', url: 'https://github.com/Sneider4' },
      { etiqueta: 'LinkedIn', url: 'https://linkedin.com/in/sneider-malagon' },
      { etiqueta: 'Contacto', url: 'mailto:malagonrichar13@gmail.com' },
    ],
  } as const;
}
