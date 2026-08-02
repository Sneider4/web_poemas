export const environment = {
  production: true,
  /** URL del backend en Railway. Reemplazar al desplegar. */
  apiUrl: 'https://TU-BACKEND.up.railway.app/api',
  /**
   * Dominio publico del sitio, sin barra final. Reemplazar al desplegar.
   * Con el se arman las URL absolutas de los meta tags: WhatsApp, Instagram
   * y compania no resuelven rutas relativas al mostrar la vista previa.
   */
  siteUrl: 'https://TU-SITIO.vercel.app',
};
