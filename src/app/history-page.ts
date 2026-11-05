import { DatePipe } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { apiErrorMessage } from './api-error';
import { HistoryApi, HistoryEventType, PackageHistoryEntry } from './history-api';
import { PackagedOrder } from './packages-api';

interface HistoryChange {
  field: string;
  before: unknown;
  after: unknown;
}

@Component({
  selector: 'app-history-page',
  imports: [DatePipe, FormsModule],
  templateUrl: './history-page.html'
})
export class HistoryPage implements OnChanges, OnDestroy {
  @Input() packages: PackagedOrder[] = [];
  @Input() initialPackageId: number | null = null;

  readonly selectedId = signal<number | null>(null);
  readonly entries = signal<PackageHistoryEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  private request?: Subscription;

  constructor(private readonly api: HistoryApi) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialPackageId'] && this.initialPackageId !== null) {
      this.selectPackage(this.initialPackageId);
    }
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }

  selectPackage(packageId: number | null): void {
    this.request?.unsubscribe();
    this.selectedId.set(packageId);
    this.entries.set([]);
    this.error.set('');
    if (packageId === null) {
      this.loading.set(false);
      return;
    }
    this.load(packageId);
  }

  refresh(): void {
    const packageId = this.selectedId();
    if (packageId !== null) this.load(packageId);
  }

  eventLabel(type: HistoryEventType): string {
    const labels: Record<HistoryEventType, string> = {
      PACKAGE_CREATED: 'Paquete creado',
      PACKAGE_UPDATED: 'Datos del paquete editados',
      PACKAGE_STATUS_CHANGED: 'Estado actualizado',
      PACKAGE_ITEM_ADDED: 'Producto agregado',
      PACKAGE_ITEM_UPDATED: 'Producto editado'
    };
    return labels[type];
  }

  changes(entry: PackageHistoryEntry): HistoryChange[] {
    const before = entry.before ?? {};
    const after = entry.after ?? {};
    return [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .filter(field => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
      .map(field => ({ field, before: before[field], after: after[field] }));
  }

  fieldLabel(field: string): string {
    const labels: Record<string, string> = {
      name: 'Nombre', reference: 'Referencia', description: 'Descripción', status: 'Estado',
      itemId: 'ID de producto', sku: 'SKU', productName: 'Producto', quantity: 'Cantidad'
    };
    return labels[field] ?? field;
  }

  valueLabel(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  private load(packageId: number): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.request = this.api.listForPackage(packageId).subscribe({
      next: entries => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(apiErrorMessage(error));
        this.loading.set(false);
      }
    });
  }
}
