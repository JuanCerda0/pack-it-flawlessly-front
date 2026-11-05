import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiRoots } from './api-endpoints';

export interface PackageDocument {
  id: number;
  packageId: number;
  documentType: 'INTAKE' | 'DISPATCH';
  documentNumber: string;
  occurredAt: string;
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsApi {
  constructor(private readonly http: HttpClient) {}

  listForPackage(packageId: number): Observable<PackageDocument[]> {
    return this.http.get<PackageDocument[]>(`${apiRoots.documents}/packages/${packageId}/documents`);
  }

  getFile(documentId: number): Observable<Blob> {
    return this.http.get(`${apiRoots.documents}/documents/${documentId}/file`, {
      responseType: 'blob'
    });
  }
}
