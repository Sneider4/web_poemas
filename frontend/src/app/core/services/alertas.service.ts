import { Injectable } from '@angular/core';
// La entrada del paquete es CommonJS. Se importa así igual, con tipos, y la
// dependencia queda declarada en `allowedCommonJsDependencies` de
// angular.json: la compilación ESM no trae archivos de tipos.
import Swal, { type SweetAlertOptions } from 'sweetalert2';

/**
 * Avisos y confirmaciones del panel.
 *
 * Centralizado a proposito: el tema y los textos de los botones se definen
 * una sola vez. Si estuviera repetido en cada componente, cualquier cambio
 * de estilo habria que hacerlo en ocho lugares y alguno quedaria distinto.
 *
 * Los estilos concretos viven en styles.scss, bajo `.swal2-*`, para poder
 * usar la paleta del sitio.
 */
@Injectable({ providedIn: 'root' })
export class AlertasService {
  /** Base compartida: quita el tema claro de la libreria. */
  private readonly base: SweetAlertOptions = {
    background: 'transparent',
    backdrop: 'rgba(31, 31, 31, 0.85)',
    customClass: {
      popup: 'alerta',
      title: 'alerta__titulo',
      htmlContainer: 'alerta__texto',
      actions: 'alerta__acciones',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-outline-secondary',
      denyButton: 'btn btn-outline-danger',
    },
    buttonsStyling: false,
  };

  /**
   * Confirmacion de algo que salio bien.
   *
   * Va como aviso flotante y no como ventana: guardar es lo que se espera
   * que pase, y frenar a la persona con un boton de "aceptar" cada vez
   * cansa. Se va solo.
   */
  exito(titulo: string, texto?: string): void {
    void Swal.fire({
      ...this.base,
      toast: true,
      position: 'top-end',
      // Sin velo: un aviso que se va solo no debe atenuar ni bloquear la
      // pagina. Con el velo heredado no se podia seguir trabajando hasta
      // que desapareciera.
      backdrop: false,
      icon: 'success',
      iconColor: '#a8c3ae',
      title: titulo,
      text: texto,
      showConfirmButton: false,
      timer: 2800,
      timerProgressBar: true,
      customClass: { ...this.base.customClass, popup: 'alerta alerta--flotante' },
    });
  }

  /** Algo fallo: esto si detiene, porque hay que enterarse. */
  error(titulo: string, texto?: string): void {
    void Swal.fire({
      ...this.base,
      icon: 'error',
      iconColor: '#d98b84',
      title: titulo,
      text: texto,
      confirmButtonText: 'Entendido',
    });
  }

  /**
   * Confirmacion antes de algo irreversible.
   * Devuelve true solo si la persona confirmo.
   */
  async confirmarEliminacion(titulo: string, detalle: string): Promise<boolean> {
    const { isConfirmed } = await Swal.fire({
      ...this.base,
      icon: 'warning',
      iconColor: '#d6c08f',
      title: titulo,
      text: detalle,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      // El foco arranca en Cancelar: si alguien aprieta Enter sin leer,
      // que no borre nada.
      focusCancel: true,
      customClass: { ...this.base.customClass, confirmButton: 'btn btn-danger' },
    });

    return isConfirmed;
  }
}
