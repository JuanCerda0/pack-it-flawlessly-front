import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export type PackageStatus =
  | 'RECEIVED'
  | 'PREPARING'
  | 'READY'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'ARCHIVED';

export interface PackageItem {
  id: number;
  sku: string | null;
  productName: string;
  quantity: number;
}

export interface PackagedOrder {
  id: number;
  name: string;
  reference: string | null;
  description: string | null;
  status: PackageStatus;
  createdAt: string;
  updatedAt: string;
  items: PackageItem[];
}

export interface PackageSummary {
  totalPackages: number;
  packagesByStatus: Record<PackageStatus, number>;
}

export interface PackagePayload {
  name: string;
  reference: string | null;
  description: string | null;
}

export interface ItemPayload {
  sku: string | null;
  productName: string;
  quantity: number;
}

const API_ROOT = 'https://2wk43coz5b.execute-api.us-east-1.amazonaws.com/Dev/api/v1';

@Injectable({ providedIn: 'root' })
export class PackagesApi {
  constructor(private readonly http: HttpClient) {}

  getPackages(): Observable<PackagedOrder[]> {
    return this.expectBody(this.http.get<PackagedOrder[]>(`${API_ROOT}/packages`), 'la lista de paquetes');
  }

  getSummary(): Observable<PackageSummary> {
    return this.expectBody(this.http.get<PackageSummary>(`${API_ROOT}/dashboard/summary`), 'el resumen');
  }

  createPackage(payload: PackagePayload): Observable<PackagedOrder> {
    return this.expectBody(this.http.post<PackagedOrder>(`${API_ROOT}/packages`, payload), 'el paquete creado');
  }

  updatePackage(id: number, payload: PackagePayload): Observable<PackagedOrder> {
    return this.expectBody(this.http.put<PackagedOrder>(`${API_ROOT}/packages/${id}`, payload), 'el paquete actualizado');
  }

  updateStatus(id: number, status: PackageStatus): Observable<PackagedOrder> {
    return this.expectBody(this.http.patch<PackagedOrder>(`${API_ROOT}/packages/${id}/status`, { status }), 'el estado actualizado');
  }

  addItem(packageId: number, payload: ItemPayload): Observable<PackageItem> {
    return this.expectBody(this.http.post<PackageItem>(`${API_ROOT}/packages/${packageId}/items`, payload), 'el producto creado');
  }

  updateItem(packageId: number, itemId: number, payload: ItemPayload): Observable<PackageItem> {
    return this.expectBody(this.http.put<PackageItem>(`${API_ROOT}/packages/${packageId}/items/${itemId}`, payload), 'el producto actualizado');
  }

  private expectBody<T>(request: Observable<T>, expected: string): Observable<T> {
    return request.pipe(map(body => {
      if (body === null || body === undefined) {
        throw new Error(`API Gateway respondió correctamente pero no entregó ${expected}. Revisa el reenvío de Authorization y la respuesta de integración.`);
      }
      return body;
    }));
  }
}
