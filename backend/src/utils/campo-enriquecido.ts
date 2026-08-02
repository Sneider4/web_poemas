import { z } from 'zod';

import { aTextoPlano, estaVacio, sanitizarTextoEnriquecido } from './sanitizar';

/**
 * Campo de texto con formato.
 *
 * Sanitiza SIEMPRE, y mide el limite sobre el texto plano: si contara el
 * HTML, unas pocas palabras con formato podrian pasarse del maximo mientras
 * que un texto largo sin formato entraria, que no tiene sentido para quien
 * escribe.
 */
export function textoEnriquecido(maximo: number, { obligatorio = false, nombre = 'texto' } = {}) {
  return z
    .string()
    .transform(sanitizarTextoEnriquecido)
    .refine((valor) => !obligatorio || !estaVacio(valor), {
      message: `El ${nombre} no puede estar vacio`,
    })
    .refine((valor) => aTextoPlano(valor).length <= maximo, {
      message: `El ${nombre} supera los ${maximo} caracteres`,
    });
}
