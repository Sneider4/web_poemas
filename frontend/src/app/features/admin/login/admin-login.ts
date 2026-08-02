import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AlertasService } from '../../../core/services/alertas.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLogin {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertas = inject(AlertasService);

  protected readonly enviando = signal(false);

  constructor() {
    // Avisos al volver de cambiar o recuperar la contraseña.
    const params = this.route.snapshot.queryParamMap;

    if (params.has('recuperada')) {
      this.alertas.exito('Listo', 'Ya podés entrar con tu contraseña nueva.');
    } else if (params.has('cambiada')) {
      this.alertas.exito('Contraseña cambiada', 'Entrá de nuevo.');
    }
  }

  protected readonly formulario = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected async ingresar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);

    try {
      await this.auth.login(this.formulario.getRawValue());

      // Vuelve a la pagina que intentaba abrir antes de que el guard lo enviara aca.
      const destino = this.route.snapshot.queryParamMap.get('redirigir') ?? '/admin/poemas';
      await this.router.navigateByUrl(destino);
    } catch {
      this.alertas.error('No pudimos entrar', 'Usuario o contraseña incorrectos.');
    } finally {
      this.enviando.set(false);
    }
  }
}
