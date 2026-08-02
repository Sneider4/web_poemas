import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // El panel es privado: no lo ve ningun buscador, siempre pide sesion y
  // vive de APIs del navegador. Se sirve como aplicacion normal.
  {
    path: 'admin/**',
    renderMode: RenderMode.Client,
  },

  // El resto se arma en el servidor en cada visita. No se prerenderiza
  // porque el contenido lo cambia Santiago desde el panel: un poema nuevo
  // o una biografia editada tienen que verse sin volver a compilar.
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
