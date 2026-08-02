import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Carpetas que acepta el backend. */
export type CategoriaImagen = 'poemas' | 'portada' | 'autor';

interface RespuestaSubida {
  url: string;
  bytes: number;
}

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/uploads`;

  /** Limite del backend; se replica aca para avisar antes de subir en vano. */
  readonly limiteBytes = 5 * 1024 * 1024;
  readonly tiposAceptados = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Sube una imagen y devuelve la ruta con la que queda guardada
   * (ej: "/uploads/poemas/xxx.jpg").
   */
  async subir(archivo: File, categoria: CategoriaImagen): Promise<string> {
    const datos = new FormData();
    datos.append('file', archivo);

    const respuesta = await firstValueFrom(
      this.http.post<RespuestaSubida>(`${this.baseUrl}/${categoria}`, datos),
    );

    return respuesta.url;
  }

  /** Borra del servidor una imagen ya subida. */
  async eliminar(url: string): Promise<void> {
    const params = new HttpParams().set('url', url);
    await firstValueFrom(this.http.delete<void>(this.baseUrl, { params }));
  }
}
