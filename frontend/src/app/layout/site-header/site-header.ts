import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface EnlaceNav {
  ruta: string;
  etiqueta: string;
  /** Solo la portada debe exigir coincidencia exacta de URL. */
  exacto?: boolean;
}

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly enlaces: readonly EnlaceNav[] = [
    { ruta: '/', etiqueta: 'Inicio', exacto: true },
    { ruta: '/poemas', etiqueta: 'Poemas' },
    { ruta: '/autor', etiqueta: 'Autor' },
    { ruta: '/comunidad', etiqueta: 'Comunidad' },
  ];

  protected readonly menuAbierto = signal(false);

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }
}
