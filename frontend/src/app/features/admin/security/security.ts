import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AlertasService } from '../../../core/services/alertas.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Contrasena y codigo de recuperacion.
 *
 * El codigo se muestra una sola vez, al generarlo: el backend guarda solo
 * su hash, asi que despues no hay forma de volver a verlo, solo de generar
 * otro (lo que invalida el anterior).
 */
@Component({
  selector: 'app-security',
  imports: [ReactiveFormsModule],
  templateUrl: './security.html',
  styleUrl: './security.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Security {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertas = inject(AlertasService);

  protected readonly admin = this.auth.admin;

  // --- Cambio de contraseña ---
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(8)]],
    repetir: ['', Validators.required],
  });

  // --- Código de recuperación ---
  protected readonly generando = signal(false);
  protected readonly codigoNuevo = signal('');
  protected readonly copiado = signal(false);

  protected async cambiarPassword(): Promise<void> {
    const { passwordActual, passwordNueva, repetir } = this.formulario.getRawValue();

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (passwordNueva !== repetir) {
      this.alertas.error('Las contraseñas no coinciden', 'Escribí la misma en los dos campos.');
      return;
    }

    this.guardando.set(true);

    try {
      await this.auth.cambiarPassword(passwordActual, passwordNueva);
      // El backend cierra la sesión: hay que volver a entrar con la nueva.
      await this.router.navigate(['/admin/login'], { queryParams: { cambiada: 1 } });
    } catch {
      this.alertas.error(
        'No pudimos cambiarla',
        'Revisá que la contraseña actual sea correcta.',
      );
    } finally {
      this.guardando.set(false);
    }
  }

  protected async generarCodigo(): Promise<void> {
    this.generando.set(true);
    this.copiado.set(false);

    try {
      this.codigoNuevo.set(await this.auth.generarCodigoRecuperacion());
    } catch {
      this.alertas.error('No pudimos generar el código', 'Intentá de nuevo en un momento.');
    } finally {
      this.generando.set(false);
    }
  }

  protected async copiarCodigo(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.codigoNuevo());
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2500);
    } catch {
      this.alertas.error('No pudimos copiarlo', 'Anotalo a mano antes de cerrar esta pantalla.');
    }
  }

  protected ocultarCodigo(): void {
    this.codigoNuevo.set('');
  }
}
