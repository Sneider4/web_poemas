import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protege las rutas del panel. Al recargar la pagina el signal esta vacio,
 * asi que primero se intenta restaurar la sesion desde la cookie httpOnly
 * antes de decidir si redirigir al login.
 */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (await auth.restaurarSesion()) {
    return true;
  }

  // Se recuerda a donde queria entrar para volver alli tras el login.
  return router.createUrlTree(['/admin/login'], {
    queryParams: { redirigir: state.url },
  });
};

/** Evita que un admin ya autenticado vuelva a ver la pantalla de login. */
export const invitadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (await auth.restaurarSesion()) {
    return router.createUrlTree(['/admin/poemas']);
  }

  return true;
};
