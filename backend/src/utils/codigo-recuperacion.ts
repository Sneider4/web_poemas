import { randomInt } from 'node:crypto';

/**
 * Alfabeto sin caracteres que se confunden al copiar a mano:
 * sin 0/O, sin 1/I/L, sin 5/S, sin 8/B.
 */
const ALFABETO = 'ACDEFGHJKMNPQRTUVWXY2346789';

const GRUPOS = 4;
const LARGO_GRUPO = 4;

/**
 * Genera un codigo del estilo `A3F9-K2M7-QX4B-7TZP`.
 *
 * Son 16 caracteres de un alfabeto de 27: unas 10^22 combinaciones. Aun
 * con el limite de intentos quitado, adivinarlo no es viable.
 *
 * Se usa `randomInt` de node:crypto y no `Math.random`, que es predecible
 * y no sirve para nada que proteja un acceso.
 */
export function generarCodigoRecuperacion(): string {
  const grupos: string[] = [];

  for (let g = 0; g < GRUPOS; g += 1) {
    let grupo = '';

    for (let i = 0; i < LARGO_GRUPO; i += 1) {
      grupo += ALFABETO[randomInt(ALFABETO.length)];
    }

    grupos.push(grupo);
  }

  return grupos.join('-');
}

/**
 * Normaliza lo que escribe la persona: mayusculas y sin guiones ni
 * espacios, para que el codigo funcione lo copie como lo copie.
 */
export function normalizarCodigo(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
