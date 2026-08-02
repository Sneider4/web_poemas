import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Esquema de las variables de entorno. Se valida al arrancar (fail fast):
 * si falta algo, el servidor no levanta y dice exactamente que falto,
 * en vez de reventar mas adelante con un error confuso.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),

  CORS_ORIGIN: z.string().default('http://localhost:4200'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('2h'),

  RATING_SALT: z.string().min(16, 'RATING_SALT debe tener al menos 16 caracteres'),

  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  ADMIN_USERNAME: z.string().optional(),
  ADMIN_INITIAL_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const detalle = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Variables de entorno invalidas:\n${detalle}\n\nRevisa tu archivo backend/.env (usa .env.example como guia).`);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  /** Lista de origenes permitidos por CORS, ya separada y limpia. */
  corsOrigins: raw.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type Env = typeof env;
