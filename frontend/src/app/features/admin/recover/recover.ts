import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AlertasService } from '../../../core/services/alertas.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Recuperar el acceso con el codigo guardado.
 *
 * Es publica a proposito: se usa justo cuando no se puede entrar. La
 * proteccion esta en el codigo (16 caracteres aleatorios) y en el limite
 * estricto de intentos del backend.
 */
@Component({
  selector: 'app-recover',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recover.html',
  styleUrl: './recover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recover {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertas = inject(AlertasService);

  protected readonly enviando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    username: ['', Validators.required],
    codigo: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(8)]],
    repetir: ['', Validators.required],
  });

  protected async recuperar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { username, codigo, passwordNueva, repetir } = this.formulario.getRawValue();

    if (passwordNueva !== repetir) {
      this.alertas.error('Las contraseñas no coinciden', 'Escribí la misma en los dos campos.');
      return;
    }

    this.enviando.set(true);

    try {
      await this.auth.recuperarAcceso({ username, codigo, passwordNueva });
      await this.router.navigate(['/admin/login'], { queryParams: { recuperada: 1 } });
    } catch (err) {
      // El 429 tiene su propio mensaje: conviene distinguirlo para que no
      // parezca que el código está mal cuando en realidad hay que esperar.
      if (err instanceof HttpErrorResponse && err.status === 429) {
        this.alertas.error(
          'Demasiados intentos',
          'Esperá una hora antes de volver a probar.',
        );
      } else {
        this.alertas.error('No pudimos verificarlo', 'El usuario o el código no son correctos.');
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
