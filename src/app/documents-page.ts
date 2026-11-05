import { DatePipe } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { apiErrorMessage } from './api-error';
import { DocumentsApi, PackageDocument } from './documents-api';
import { PackagedOrder } from './packages-api';

@Component({
  selector: 'app-documents-page',
  imports: [DatePipe, FormsModule],
  templateUrl: './documents-page.html'
})
export class DocumentsPage implements OnChanges, OnDestroy {
  @Input() packages: PackagedOrder[] = [];
  @Input() initialPackageId: number | null = null;

  readonly selectedId = signal<number | null>(null);
  readonly documents = signal<PackageDocument[]>([]);
  readonly loading = signal(false);
  readonly downloadingId = signal<number | null>(null);
  readonly error = signal('');

  private listRequest?: Subscription;
  private fileRequest?: Subscription;

  constructor(private readonly api: DocumentsApi) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialPackageId'] && this.initialPackageId !== null) {
      this.selectPackage(this.initialPackageId);
    }
  }

  ngOnDestroy(): void {
    this.listRequest?.unsubscribe();
    this.fileRequest?.unsubscribe();
  }

  selectPackage(packageId: number | null): void {
    this.listRequest?.unsubscribe();
    this.selectedId.set(packageId);
    this.documents.set([]);
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

  typeLabel(type: PackageDocument['documentType']): string {
    return type === 'INTAKE' ? 'Ingreso' : 'Despacho';
  }

  download(document: PackageDocument): void {
    this.fileRequest?.unsubscribe();
    this.downloadingId.set(document.id);
    this.error.set('');
    this.fileRequest = this.api.getFile(document.id).subscribe({
      next: pdf => {
        const url = URL.createObjectURL(pdf);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${document.documentNumber}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.downloadingId.set(null);
      },
      error: error => {
        this.error.set(apiErrorMessage(error));
        this.downloadingId.set(null);
      }
    });
  }

  private load(packageId: number): void {
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.listRequest = this.api.listForPackage(packageId).subscribe({
      next: documents => {
        this.documents.set(documents);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(apiErrorMessage(error));
        this.loading.set(false);
      }
    });
  }
}
