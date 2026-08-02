import bcrypt from 'bcryptjs';

import { prisma } from '../../db/prisma';
import {
  generarCodigoRecuperacion,
  normalizarCodigo,
} from '../../utils/codigo-recuperacion';
import { HttpError } from '../../utils/http-error';
import type { CambiarPasswordDto, LoginDto, RecuperarDto } from './admin-auth.schema';

export const adminAuthService = {
  /**
   * Valida las credenciales. El mensaje de error es el mismo para usuario
   * inexistente y contrasena incorrecta, para no revelar que usuarios existen.
   */
  async validarCredenciales({ username, password }: LoginDto) {
    const admin = await prisma.adminUser.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!admin) {
      throw HttpError.unauthorized('Usuario o contrasena incorrectos');
    }

    const coincide = await bcrypt.compare(password, admin.passwordHash);

    if (!coincide) {
      throw HttpError.unauthorized('Usuario o contrasena incorrectos');
    }

    return { id: admin.id, username: admin.username };
  },

  async obtenerPorId(id: string) {
    const admin = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, username: true, recoveryCodeHash: true },
    });

    if (!admin) {
      throw HttpError.unauthorized('La sesion ya no es valida');
    }

    // El hash nunca sale del backend: afuera solo se dice si hay o no.
    return {
      id: admin.id,
      username: admin.username,
      tieneCodigoRecuperacion: admin.recoveryCodeHash !== null,
    };
  },

  /**
   * Genera un codigo nuevo y devuelve el texto plano UNA sola vez.
   * En la base solo queda su hash, asi que ni con acceso a la base se
   * puede recuperar el codigo: hay que generar otro.
   *
   * Generar uno nuevo invalida el anterior.
   */
  async generarCodigo(id: string) {
    const codigo = generarCodigoRecuperacion();

    await prisma.adminUser.update({
      where: { id },
      data: { recoveryCodeHash: await bcrypt.hash(normalizarCodigo(codigo), 12) },
    });

    return codigo;
  },

  /**
   * Cambia la contrasena usando el codigo de recuperacion.
   *
   * El codigo es de un solo uso: al aplicarse queda invalidado, para que
   * uno filtrado no sirva para volver a entrar mas adelante.
   */
  async recuperar({ username, codigo, passwordNueva }: RecuperarDto) {
    const admin = await prisma.adminUser.findUnique({
      where: { username: username.toLowerCase() },
    });

    // Mensaje unico para usuario inexistente, sin codigo activo y codigo
    // incorrecto: si no, se podria averiguar que usuarios existen.
    const generico = HttpError.unauthorized('Usuario o codigo incorrectos');

    if (!admin || !admin.recoveryCodeHash) {
      throw generico;
    }

    const coincide = await bcrypt.compare(normalizarCodigo(codigo), admin.recoveryCodeHash);

    if (!coincide) {
      throw generico;
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: await bcrypt.hash(passwordNueva, 12),
        // Consumido: hay que generar uno nuevo desde el panel.
        recoveryCodeHash: null,
      },
    });
  },

  async cambiarPassword(id: string, { passwordActual, passwordNueva }: CambiarPasswordDto) {
    const admin = await prisma.adminUser.findUnique({ where: { id } });

    if (!admin) {
      throw HttpError.unauthorized('La sesion ya no es valida');
    }

    const coincide = await bcrypt.compare(passwordActual, admin.passwordHash);

    if (!coincide) {
      throw HttpError.badRequest('La contrasena actual no es correcta');
    }

    await prisma.adminUser.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(passwordNueva, 12) },
    });
  },
};
