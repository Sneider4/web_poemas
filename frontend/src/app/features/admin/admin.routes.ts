import type { Routes } from '@angular/router';

import { adminGuard, invitadoGuard } from '../../core/guards/admin.guard';

/**
 * Rutas del panel, cargadas de forma diferida: quien solo visita el sitio
 * publico nunca descarga este codigo.
 */
export const adminRoutes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./login/admin-login').then((m) => m.AdminLogin),
    title: 'Ingresar | Panel',
  },
  {
    path: 'recuperar',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./recover/recover').then((m) => m.Recover),
    title: 'Recuperar el acceso | Panel',
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: 'poemas',
        loadComponent: () => import('./poems-manager/poems-manager').then((m) => m.PoemsManager),
        title: 'Poemas | Panel',
      },
      {
        path: 'poemas/nuevo',
        loadComponent: () => import('./poem-form/poem-form').then((m) => m.PoemForm),
        title: 'Nuevo poema | Panel',
      },
      {
        path: 'poemas/:id/editar',
        loadComponent: () => import('./poem-form/poem-form').then((m) => m.PoemForm),
        title: 'Editar poema | Panel',
      },
      {
        path: 'portada',
        loadComponent: () => import('./home-editor/home-editor').then((m) => m.HomeEditor),
        title: 'Página principal | Panel',
      },
      {
        path: 'autor',
        loadComponent: () => import('./author-editor/author-editor').then((m) => m.AuthorEditor),
        title: 'Autor | Panel',
      },
      {
        path: 'comunidad',
        loadComponent: () =>
          import('./community-moderation/community-moderation').then((m) => m.CommunityModeration),
        title: 'Comunidad | Panel',
      },
      {
        path: 'seguridad',
        loadComponent: () => import('./security/security').then((m) => m.Security),
        title: 'Seguridad | Panel',
      },
      { path: '', pathMatch: 'full', redirectTo: 'poemas' },
    ],
  },
];
