import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.aplicarPagina('Página no encontrada', 'Este enlace no lleva a ningún lado.', '/404');
  }
}
