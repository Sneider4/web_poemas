import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/** Paginas fijas del sitio, con la importancia relativa que se le da a cada una. */
const PAGINAS_FIJAS: [ruta: string, prioridad: string][] = [
  ['/', '1.0'],
  ['/poemas', '0.9'],
  ['/autor', '0.6'],
  ['/comunidad', '0.6'],
];

/**
 * robots.txt y sitemap.xml se sirven desde aca, no como archivos sueltos,
 * por dos razones: el dominio sale de la configuracion (no hay que editar
 * un .txt al desplegar) y el listado de poemas se arma en el momento, asi
 * que un poema nuevo aparece en el sitemap sin volver a compilar.
 */
app.get('/robots.txt', (_req, res) => {
  res
    .type('text/plain')
    .send(
      [
        'User-agent: *',
        'Allow: /',
        // El panel no tiene nada que buscar y pide sesion.
        'Disallow: /admin',
        '',
        `Sitemap: ${environment.siteUrl}/sitemap.xml`,
        '',
      ].join('\n'),
    );
});

app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const respuesta = await fetch(`${environment.apiUrl}/poems`);

    if (!respuesta.ok) {
      throw new Error(`La API respondio ${respuesta.status}`);
    }

    const poemas = (await respuesta.json()) as { slug: string; updatedAt: string }[];

    const urls = [
      ...PAGINAS_FIJAS.map(([ruta, prioridad]) => entrada(ruta, prioridad)),
      ...poemas.map((poema) => entrada(`/poemas/${poema.slug}`, '0.8', poema.updatedAt)),
    ];

    res
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      );
  } catch (error) {
    next(error);
  }
});

function entrada(ruta: string, prioridad: string, fecha?: string): string {
  const lastmod = fecha ? `\n    <lastmod>${fecha.slice(0, 10)}</lastmod>` : '';
  return `  <url>\n    <loc>${environment.siteUrl}${ruta}</loc>${lastmod}\n    <priority>${prioridad}</priority>\n  </url>`;
}

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
