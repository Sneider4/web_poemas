import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { Author, AuthorInput } from '../models/author.model';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/author`;
  private readonly adminUrl = `${environment.apiUrl}/admin/author`;

  readonly autor = signal<Author | null>(null);
  readonly cargando = signal(false);

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.autor.set(await firstValueFrom(this.http.get<Author>(this.baseUrl)));
    } finally {
      this.cargando.set(false);
    }
  }

  async actualizar(datos: AuthorInput): Promise<Author> {
    const autor = await firstValueFrom(this.http.put<Author>(this.adminUrl, datos));
    this.autor.set(autor);
    return autor;
  }
}
