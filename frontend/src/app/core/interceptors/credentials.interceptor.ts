import type { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

/** Endpoints que necesitan la cookie de sesion. */
const RUTAS_CON_SESION = `${environment.apiUrl}/admin`;

/**
 * Adjunta las cookies a las peticiones del panel.
 * Es lo que permite que la cookie httpOnly de sesion viaje al backend,
 * incluso cuando front y back estan en dominios distintos
 * (Vercel -> Railway) en produccion.
 *
 * Lo publico va sin credenciales a proposito: no las necesita, y Angular
 * no guarda en la cache de transferencia ninguna respuesta pedida con
 * credenciales. Marcarlas todas obligaba al navegador a repetir, ya
 * hidratado, cada peticion que el servidor acababa de hacer.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(RUTAS_CON_SESION)) {
    return next(req);
  }

  return next(req.clone({ withCredentials: true }));
};
