import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  CommunityPost,
  CommunityPostInput,
  Paginated,
} from '../models/community-post.model';

/** Clave de localStorage donde se recuerdan las publicaciones ya calificadas. */
const CALIFICADOS_KEY = 'santiago:calificados';

interface RespuestaCalificacion {
  postId: string;
  ratingCount: number;
  calificado: boolean;
}

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly http = inject(HttpClient);

  /** Al renderizar en el servidor no hay `localStorage` que consultar. */
  private readonly enNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly baseUrl = `${environment.apiUrl}/community`;
  private readonly adminUrl = `${environment.apiUrl}/admin/community`;

  readonly publicaciones = signal<CommunityPost[]>([]);
  readonly cargando = signal(false);
  readonly totalPaginas = signal(1);
  readonly pagina = signal(1);

  /**
   * Ids ya calificados por este navegador. Es solo para la UI (deshabilitar
   * el boton al instante); la barrera real es el constraint unico del backend,
   * que responde 409 aunque se limpie el localStorage.
   */
  private readonly calificados = signal<Set<string>>(this.leerCalificados());

  yaCalifico(postId: string): boolean {
    return this.calificados().has(postId);
  }

  async cargar(pagina = 1): Promise<void> {
    this.cargando.set(true);
    try {
      const params = new HttpParams().set('page', pagina).set('pageSize', 20);
      const respuesta = await firstValueFrom(
        this.http.get<Paginated<CommunityPost>>(this.baseUrl, { params }),
      );
      this.publicaciones.set(respuesta.items);
      this.totalPaginas.set(respuesta.totalPages);
      this.pagina.set(respuesta.page);
    } finally {
      this.cargando.set(false);
    }
  }

  async publicar(datos: CommunityPostInput): Promise<CommunityPost> {
    const post = await firstValueFrom(this.http.post<CommunityPost>(this.baseUrl, datos));
    // Se antepone para que aparezca de inmediato sin recargar el tablero.
    this.publicaciones.update((lista) => [post, ...lista]);
    return post;
  }

  /**
   * Alterna el me gusta: lo pone si no estaba, lo quita si ya estaba.
   *
   * Un 409 al ponerlo significa "ya lo tenias" (por ejemplo si se limpio el
   * localStorage): no es un error que mostrar, solo se sincroniza el estado.
   */
  async alternarCalificacion(postId: string): Promise<void> {
    const teniaMeGusta = this.yaCalifico(postId);

    try {
      const respuesta = await firstValueFrom(
        teniaMeGusta
          ? this.http.delete<RespuestaCalificacion>(`${this.baseUrl}/${postId}/rating`)
          : this.http.post<RespuestaCalificacion>(`${this.baseUrl}/${postId}/rating`, {}),
      );

      this.actualizarConteo(postId, respuesta.ratingCount);
      this.recordarCalificado(postId, respuesta.calificado);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        // El backend ya lo tenia registrado: se alinea la vista con eso.
        this.recordarCalificado(postId, true);
        return;
      }

      throw error;
    }
  }

  private actualizarConteo(postId: string, ratingCount: number): void {
    this.publicaciones.update((lista) =>
      lista.map((post) => (post.id === postId ? { ...post, ratingCount } : post)),
    );
  }

  // --- Moderacion (panel) ---

  async cargarTodas(pagina = 1): Promise<void> {
    this.cargando.set(true);
    try {
      const params = new HttpParams().set('page', pagina).set('pageSize', 20);
      const respuesta = await firstValueFrom(
        this.http.get<Paginated<CommunityPost>>(this.adminUrl, { params }),
      );
      this.publicaciones.set(respuesta.items);
      this.totalPaginas.set(respuesta.totalPages);
      this.pagina.set(respuesta.page);
    } finally {
      this.cargando.set(false);
    }
  }

  async moderar(postId: string, hidden: boolean): Promise<void> {
    const post = await firstValueFrom(
      this.http.patch<CommunityPost>(`${this.adminUrl}/${postId}`, { hidden }),
    );
    this.publicaciones.update((lista) => lista.map((p) => (p.id === postId ? post : p)));
  }

  async eliminar(postId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.adminUrl}/${postId}`));
    this.publicaciones.update((lista) => lista.filter((p) => p.id !== postId));
  }

  // --- localStorage ---

  private leerCalificados(): Set<string> {
    if (!this.enNavegador) {
      return new Set<string>();
    }

    try {
      const guardado = localStorage.getItem(CALIFICADOS_KEY);
      return new Set<string>(guardado ? JSON.parse(guardado) : []);
    } catch {
      // localStorage puede fallar en modo privado; no vale la pena romper la UI.
      return new Set<string>();
    }
  }

  /** Recuerda (o olvida) que este navegador califico una publicacion. */
  private recordarCalificado(postId: string, calificado: boolean): void {
    this.calificados.update((actual) => {
      const nuevo = new Set(actual);

      if (calificado) {
        nuevo.add(postId);
      } else {
        nuevo.delete(postId);
      }

      try {
        if (this.enNavegador) {
          localStorage.setItem(CALIFICADOS_KEY, JSON.stringify([...nuevo]));
        }
      } catch {
        // Sin persistencia el estado se pierde al recargar, pero el backend
        // sigue siendo la fuente de verdad: responde 409 si ya estaba puesto.
      }

      return nuevo;
    });
  }
}
