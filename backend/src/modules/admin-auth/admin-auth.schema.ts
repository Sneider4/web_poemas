import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'El usuario es obligatorio').max(60),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});

export type LoginDto = z.infer<typeof loginSchema>;

/** Minimo para la contrasena nueva, compartido por cambio y recuperacion. */
const passwordNueva = z
  .string()
  .min(8, 'La nueva contrasena debe tener al menos 8 caracteres')
  .max(200);

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Ingresa tu contrasena actual'),
  passwordNueva,
});

export type CambiarPasswordDto = z.infer<typeof cambiarPasswordSchema>;

export const recuperarSchema = z.object({
  username: z.string().trim().min(1, 'El usuario es obligatorio').max(60),
  codigo: z.string().min(1, 'El codigo es obligatorio').max(60),
  passwordNueva,
});

export type RecuperarDto = z.infer<typeof recuperarSchema>;
