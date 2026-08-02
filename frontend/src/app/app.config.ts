import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEs from '@angular/common/locales/es';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { routes } from './app.routes';

// Fechas y textos en espanol ("1 de agosto de 2026").
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    { provide: LOCALE_ID, useValue: 'es' },
    provideRouter(
      routes,
      // Permite recibir los params de ruta como inputs del componente.
      withComponentInputBinding(),
      // Al cambiar de poema la lectura empieza arriba, no a media pagina.
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      // Funde una pagina con la siguiente en vez del corte seco. Los
      // navegadores que no soportan View Transitions simplemente navegan
      // como siempre, sin error.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    provideClientHydration(withEventReplay()),
  ],
};
