export interface AdminUser {
  id: string;
  /** Nombre de usuario con el que Santiago entra al panel. */
  username: string;
  /** Si hay un codigo de recuperacion activo. El codigo en si nunca viaja. */
  tieneCodigoRecuperacion?: boolean;
}

export interface LoginInput {
  username: string;
  password: string;
}

/** Datos para recuperar el acceso con el codigo guardado. */
export interface RecuperarInput {
  username: string;
  codigo: string;
  passwordNueva: string;
}
