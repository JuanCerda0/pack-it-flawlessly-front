import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiRoots } from './api-endpoints';

export type HistoryEventType =
  | 'PACKAGE_CREATED'
  | 'PACKAGE_UPDATED'
  | 'PACKAGE_STATUS_CHANGED'
  | 'PACKAGE_ITEM_ADDED'
  | 'PACKAGE_ITEM_UPDATED';

export interface PackageHistoryEntry {
  eventId: string;
  packageId: number;
  type: HistoryEventType;
  occurredAt: string;
  actorId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

@Injectable({ providedIn: 'root' })
export class HistoryApi {
  constructor(private readonly http: HttpClient) {}

  listForPackage(packageId: number): Observable<PackageHistoryEntry[]> {
    return this.http.get<PackageHistoryEntry[]>(`${apiRoots.history}/packages/${packageId}/history`);
  }
}
