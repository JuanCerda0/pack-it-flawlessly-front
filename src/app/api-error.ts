import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'No fue posible completar la solicitud.';
  if (error.status === 0) return 'No se pudo conectar con el servicio. Revisa que esté iniciado y permita este origen.';
  if (error.status === 401) return 'Tu sesión expiró o el access token no fue aceptado. Inicia sesión de nuevo.';
  if (error.status === 403) return 'Tu rol no tiene permiso para consultar este recurso.';
  if (error.status === 404) return 'El recurso solicitado ya no está disponible.';
  return `El servicio respondió con el estado ${error.status}. Inténtalo nuevamente.`;
}
