import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { urlDeImagen } from '../../core/data/imagenes';
import { AuthorService } from '../../core/services/author.service';
import { SeoService } from '../../core/services/seo.service';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-author-page',
  imports: [LoadingSpinner],
  templateUrl: './author-page.html',
  styleUrl: './author-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorPage implements OnInit {
  private readonly authorService = inject(AuthorService);
  private readonly seo = inject(SeoService);

  protected readonly autor = this.authorService.autor;
  protected readonly cargando = this.authorService.cargando;

  /** Resuelve la ruta guardada contra el origen del backend. */
  protected readonly urlFoto = urlDeImagen;

  ngOnInit(): void {
    void this.authorService.cargar();
    this.seo.aplicarPagina(
      'Autor',
      'Quién es Santiago, el que escribe todo esto.',
      '/autor',
    );
  }
}
