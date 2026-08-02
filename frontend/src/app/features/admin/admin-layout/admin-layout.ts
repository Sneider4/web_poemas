import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly admin = this.auth.admin;

  protected readonly secciones = [
    { ruta: '/admin/poemas', etiqueta: 'Poemas' },
    { ruta: '/admin/portada', etiqueta: 'Página principal' },
    { ruta: '/admin/autor', etiqueta: 'Autor' },
    { ruta: '/admin/comunidad', etiqueta: 'Comunidad' },
    { ruta: '/admin/seguridad', etiqueta: 'Seguridad' },
  ];

  protected async salir(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/admin/login']);
  }
}
