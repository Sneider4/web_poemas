import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AdminUser, LoginInput, RecuperarInput } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  readonly admin = signal<AdminUser | null>(null);
  readonly autenticado = computed(() => this.admin() !== null);

  /** Evita repetir la llamada a /me en cada navegacion dentro del panel. */
  private sesionVerificada = false;

  async login(datos: LoginInput): Promise<AdminUser> {
    // El token llega en una cookie httpOnly: no hay nada que guardar aqui.
    const admin = await firstValueFrom(this.http.post<AdminUser>(`${this.baseUrl}/login`, datos));
    this.admin.set(admin);
    this.sesionVerificada = true;
    return admin;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post<void>(`${this.baseUrl}/logout`, {}));
    } finally {
      this.admin.set(null);
      this.sesionVerificada = false;
    }
  }

  /**
   * Recupera la sesion desde la cookie al recargar la pagina.
   * Sin esto, un F5 dentro del panel expulsaria al admin al login.
   */
  async restaurarSesion(): Promise<boolean> {
    if (this.sesionVerificada) {
      return this.autenticado();
    }

    try {
      this.admin.set(await firstValueFrom(this.http.get<AdminUser>(`${this.baseUrl}/me`)));
    } catch {
      this.admin.set(null);
    } finally {
      this.sesionVerificada = true;
    }

    return this.autenticado();
  }

  async cambiarPassword(passwordActual: string, passwordNueva: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/password`, { passwordActual, passwordNueva }),
    );
    // El backend cierra la sesion al cambiar la clave.
    this.admin.set(null);
    this.sesionVerificada = false;
  }

  /**
   * Genera un código de recuperación nuevo. El texto plano llega una sola
   * vez: el backend solo guarda su hash.
   */
  async generarCodigoRecuperacion(): Promise<string> {
    const { codigo } = await firstValueFrom(
      this.http.post<{ codigo: string }>(`${this.baseUrl}/recovery-code`, {}),
    );

    // Ahora sí hay uno activo; se refleja sin volver a pedir /me.
    this.admin.update((actual) =>
      actual ? { ...actual, tieneCodigoRecuperacion: true } : actual,
    );

    return codigo;
  }

  /** Cambia la contraseña usando el código, sin necesidad de estar dentro. */
  async recuperarAcceso(datos: RecuperarInput): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/recover`, datos));

    this.admin.set(null);
    this.sesionVerificada = false;
  }
}
