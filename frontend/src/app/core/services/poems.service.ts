import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { Poem, PoemInput } from '../models/poem.model';

@Injectable({ providedIn: 'root' })
export class PoemsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/poems`;
  private readonly adminUrl = `${environment.apiUrl}/admin/poems`;

  /** Indice publico de poemas publicados. */
  readonly poemas = signal<Poem[]>([]);
  /** Poemas destacados de la portada. */
  readonly destacados = signal<Poem[]>([]);
  /** Listado del panel, incluye borradores. */
  readonly todos = signal<Poem[]>([]);
  readonly cargando = signal(false);

  async cargarPublicos(): Promise<void> {
    this.cargando.set(true);
    try {
      this.poemas.set(await firstValueFrom(this.http.get<Poem[]>(this.baseUrl)));
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarDestacados(limite = 3): Promise<void> {
    const params = new HttpParams().set('featured', 'true').set('limit', limite);
    this.destacados.set(await firstValueFrom(this.http.get<Poem[]>(this.baseUrl, { params })));
  }

  obtenerPorSlug(slug: string): Promise<Poem> {
    return firstValueFrom(this.http.get<Poem>(`${this.baseUrl}/${slug}`));
  }

  // --- Panel de administracion ---

  async cargarTodos(): Promise<void> {
    this.cargando.set(true);
    try {
      this.todos.set(await firstValueFrom(this.http.get<Poem[]>(this.adminUrl)));
    } finally {
      this.cargando.set(false);
    }
  }

  obtenerPorId(id: string): Promise<Poem> {
    return firstValueFrom(this.http.get<Poem>(`${this.adminUrl}/${id}`));
  }

  async crear(datos: PoemInput): Promise<Poem> {
    const poema = await firstValueFrom(this.http.post<Poem>(this.adminUrl, datos));
    await this.cargarTodos();
    return poema;
  }

  async actualizar(id: string, datos: Partial<PoemInput>): Promise<Poem> {
    const poema = await firstValueFrom(this.http.put<Poem>(`${this.adminUrl}/${id}`, datos));
    await this.cargarTodos();
    return poema;
  }

  async eliminar(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.adminUrl}/${id}`));
    this.todos.update((lista) => lista.filter((poema) => poema.id !== id));
  }
}
