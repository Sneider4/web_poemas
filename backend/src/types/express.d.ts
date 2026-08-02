/**
 * Extiende el Request de Express con el admin autenticado,
 * que inyecta el middleware `requireAdmin`.
 */
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        username: string;
      };
    }
  }
}

export {};
