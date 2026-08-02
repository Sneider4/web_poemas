import type { Routes } from '@angular/router';

export const routes: Routes = [
  // El panel va primero: la ruta publica de abajo tiene path '' (que hace
  // match por prefijo) y su comodin se quedaria con /admin.
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'poemas',
        loadComponent: () =>
          import('./features/poems/poem-list/poem-list').then((m) => m.PoemList),
      },
      {
        path: 'poemas/:slug',
        loadComponent: () =>
          import('./features/poems/poem-detail/poem-detail').then((m) => m.PoemDetail),
      },
      {
        path: 'autor',
        loadComponent: () => import('./features/author/author-page').then((m) => m.AuthorPage),
      },
      {
        path: 'comunidad',
        loadComponent: () =>
          import('./features/community/community-board/community-board').then(
            (m) => m.CommunityBoard,
          ),
      },
      // Dentro del layout publico para que la pagina de error conserve el
      // encabezado y el pie, y desde ahi se pueda seguir navegando.
      {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
