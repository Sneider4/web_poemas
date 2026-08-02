/**
 * Entrada de la funcion serverless de Vercel.
 *
 * Vercel no sabe arrancar el servidor de Angular por su cuenta: espera un
 * archivo dentro de `api/` que exporte un manejador. Este solo delega en el
 * `reqHandler` que genera `ng build` (ver src/server.ts).
 *
 * El import es dinamico a proposito: asi el bundle del servidor se carga
 * cuando llega la primera peticion y no al desplegar.
 */
export default async (req, res) => {
  const { reqHandler } = await import('../dist/frontend/server/server.mjs');
  return reqHandler(req, res);
};
