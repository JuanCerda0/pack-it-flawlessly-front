import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fetchAuthSession, getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import { DocumentsPage } from './documents-page';
import { HistoryPage } from './history-page';
import {
  ItemPayload,
  PackageItem,
  PackagePayload,
  PackageStatus,
  PackageSummary,
  PackagedOrder,
  PackagesApi
} from './packages-api';

type ModalMode = 'create' | 'edit' | 'details' | null;
type View = 'dashboard' | 'history' | 'documents';

@Component({
  selector: 'app-root',
  imports: [DatePipe, FormsModule, HistoryPage, DocumentsPage],
  templateUrl: './app.html'
})
export class App implements OnInit {
  protected readonly title = 'Pack-it-flawlessly';
  protected readonly statuses: PackageStatus[] = [
    'RECEIVED', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'ARCHIVED'
  ];

  readonly checkingSession = signal(true);
  readonly authenticated = signal(false);
  readonly username = signal('');
  readonly displayName = signal('');
  readonly role = signal<'ADMIN' | 'SUPERVISOR' | 'UNASSIGNED'>('UNASSIGNED');
  readonly packages = signal<PackagedOrder[]>([]);
  readonly summary = signal<PackageSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly modal = signal<ModalMode>(null);
  readonly selectedPackage = signal<PackagedOrder | null>(null);
  readonly view = signal<View>('dashboard');
  readonly initialPackageId = signal<number | null>(null);
  readonly search = signal('');
  readonly statusFilter = signal<'ALL' | PackageStatus>('ALL');
  readonly filteredPackages = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.packages().filter(pkg => {
      const matchesStatus = this.statusFilter() === 'ALL' || pkg.status === this.statusFilter();
      const matchesQuery = !query || [pkg.name, pkg.reference ?? '', String(pkg.id)]
        .some(value => value.toLocaleLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  });

  packageForm = { name: '', reference: '', description: '' };
  itemForm = { sku: '', productName: '', quantity: 1 };
  editingItemId: number | null = null;
  itemEditorOpen = false;
  readonly saving = signal(false);

  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly api: PackagesApi) {}

  ngOnInit(): void {
    void this.restoreSession();
  }

  get isAdmin(): boolean {
    return this.role() === 'ADMIN';
  }

  get initials(): string {
    const initials = this.displayName().trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('');
    return initials.toUpperCase() || 'PF';
  }

  get greetingName(): string {
    return this.displayName().trim().split(/\s+/)[0] || 'equipo';
  }

  async login(): Promise<void> {
    this.error.set('');
    try {
      await signInWithRedirect();
    } catch {
      this.error.set('No fue posible iniciar el flujo de inicio de sesión. Inténtalo otra vez.');
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut();
      this.resetSession();
    } catch {
      this.error.set('No fue posible cerrar la sesión.');
    }
  }

  refresh(): void {
    this.loadDashboard();
  }

  navigate(view: View, packageId: number | null = null): void {
    this.initialPackageId.set(packageId);
    this.view.set(view);
    this.closeModal();
  }

  viewLabel(): string {
    if (this.view() === 'history') return 'Historial';
    if (this.view() === 'documents') return 'Documentos';
    return 'Resumen';
  }

  openDetails(pkg: PackagedOrder): void {
    this.selectedPackage.set(pkg);
    this.clearItemForm();
    this.error.set('');
    this.modal.set('details');
  }

  openCreate(): void {
    this.packageForm = { name: '', reference: '', description: '' };
    this.error.set('');
    this.modal.set('create');
  }

  openEdit(pkg: PackagedOrder): void {
    this.selectedPackage.set(pkg);
    this.packageForm = {
      name: pkg.name,
      reference: pkg.reference ?? '',
      description: pkg.description ?? ''
    };
    this.error.set('');
    this.modal.set('edit');
  }

  openAddItem(): void {
    this.editingItemId = null;
    this.itemForm = { sku: '', productName: '', quantity: 1 };
    this.itemEditorOpen = true;
  }

  closeModal(): void {
    this.modal.set(null);
    this.editingItemId = null;
  }

  savePackage(): void {
    if (this.saving() || !this.packageForm.name.trim()) return;
    const editing = this.modal() === 'edit' && this.selectedPackage() !== null;
    this.saving.set(true);
    this.error.set('');
    const payload: PackagePayload = {
      name: this.packageForm.name.trim(),
      reference: this.packageForm.reference.trim() || null,
      description: this.packageForm.description.trim() || null
    };
    const selected = this.selectedPackage();
    const request = editing && selected
      ? this.api.updatePackage(selected.id, payload)
      : this.api.createPackage(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.showNotice(editing ? 'Paquete actualizado.' : 'Paquete creado.');
        this.loadDashboard();
      },
      error: error => {
        this.saving.set(false);
        this.error.set(this.getErrorMessage(error));
      }
    });
  }

  advanceStatus(pkg: PackagedOrder): void {
    const next = this.nextStatus(pkg.status);
    if (!next || this.saving()) return;
    this.saving.set(true);
    this.api.updateStatus(pkg.id, next).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotice(`Estado actualizado a ${this.statusLabel(next)}.`);
        this.loadDashboard();
        if (this.selectedPackage()?.id === pkg.id) this.refreshSelectedPackage(pkg.id);
      },
      error: error => {
        this.saving.set(false);
        this.error.set(this.getErrorMessage(error));
      }
    });
  }

  archivePackage(pkg: PackagedOrder): void {
    if (pkg.status === 'ARCHIVED' || this.saving()) return;
    if (!window.confirm(`¿Archivar “${pkg.name}”? El registro se conservará, pero no podrá editarse.`)) return;
    this.saving.set(true);
    this.api.updateStatus(pkg.id, 'ARCHIVED').subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotice('Paquete archivado. El registro se conserva para trazabilidad.');
        this.loadDashboard();
        if (this.selectedPackage()?.id === pkg.id) this.refreshSelectedPackage(pkg.id);
      },
      error: error => {
        this.saving.set(false);
        this.error.set(this.getErrorMessage(error));
      }
    });
  }

  prepareItemEdit(item: PackageItem): void {
    this.editingItemId = item.id;
    this.itemEditorOpen = true;
    this.itemForm = { sku: item.sku ?? '', productName: item.productName, quantity: item.quantity };
  }

  saveItem(): void {
    const pkg = this.selectedPackage();
    if (!pkg || !this.itemForm.productName.trim() || this.saving()) return;
    const editing = this.editingItemId !== null;
    this.saving.set(true);
    const payload: ItemPayload = {
      sku: this.itemForm.sku.trim() || null,
      productName: this.itemForm.productName.trim(),
      quantity: Number(this.itemForm.quantity)
    };
    const request = this.editingItemId === null
      ? this.api.addItem(pkg.id, payload)
      : this.api.updateItem(pkg.id, this.editingItemId, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.clearItemForm();
        this.showNotice(editing ? 'Producto actualizado.' : 'Producto agregado.');
        this.refreshSelectedPackage(pkg.id);
        this.loadDashboard();
      },
      error: error => {
        this.saving.set(false);
        this.error.set(this.getErrorMessage(error));
      }
    });
  }

  cancelItemEdit(): void {
    this.clearItemForm();
  }

  statusLabel(status: PackageStatus): string {
    const labels: Record<PackageStatus, string> = {
      RECEIVED: 'Recibido', PREPARING: 'En preparación', READY: 'Listo',
      IN_TRANSIT: 'En tránsito', DELIVERED: 'Entregado', ARCHIVED: 'Archivado'
    };
    return labels[status];
  }

  statusClass(status: PackageStatus): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  nextStatus(status: PackageStatus): PackageStatus | null {
    const transitions: Partial<Record<PackageStatus, PackageStatus>> = {
      RECEIVED: 'PREPARING', PREPARING: 'READY', READY: 'IN_TRANSIT', IN_TRANSIT: 'DELIVERED'
    };
    return transitions[status] ?? null;
  }

  trackById(_: number, item: PackagedOrder): number {
    return item.id;
  }

  private async restoreSession(): Promise<void> {
    try {
      const [user, session] = await Promise.all([getCurrentUser(), fetchAuthSession()]);
      const token = session.tokens?.accessToken;
      if (!token) throw new Error('No access token');
      const groupsClaim = token.payload['cognito:groups'];
      const groups = Array.isArray(groupsClaim) ? groupsClaim : [];
      const idClaims = session.tokens?.idToken?.payload ?? {};
      const givenName = typeof idClaims['given_name'] === 'string' ? idClaims['given_name'].trim() : '';
      const familyName = typeof idClaims['family_name'] === 'string' ? idClaims['family_name'].trim() : '';
      const fullName = [givenName, familyName].filter(Boolean).join(' ');
      const claimName = (...values: unknown[]): string =>
        values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
      this.username.set(user.username);
      const configuredName = claimName(idClaims['name'])
        || fullName
        || claimName(idClaims['preferred_username'])
        || claimName(idClaims['email'])
        || user.username;
      this.displayName.set(configuredName);
      this.role.set(groups.includes('ADMIN') ? 'ADMIN' : groups.includes('SUPERVISOR') ? 'SUPERVISOR' : 'UNASSIGNED');
      this.authenticated.set(true);
      this.loadDashboard();
    } catch {
      this.authenticated.set(false);
    } finally {
      this.checkingSession.set(false);
    }
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getPackages().subscribe({
      next: packages => {
        this.packages.set(packages);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(error));
      }
    });
    this.api.getSummary().subscribe({
      next: summary => this.summary.set(summary),
      error: error => this.error.set(this.getErrorMessage(error))
    });
  }

  private refreshSelectedPackage(id: number): void {
    this.api.getPackages().subscribe({
      next: packages => {
        this.packages.set(packages);
        this.selectedPackage.set(packages.find(pkg => pkg.id === id) ?? null);
      },
      error: error => this.error.set(this.getErrorMessage(error))
    });
  }

  private clearItemForm(): void {
    this.editingItemId = null;
    this.itemEditorOpen = false;
    this.itemForm = { sku: '', productName: '', quantity: 1 };
  }

  private resetSession(): void {
    this.authenticated.set(false);
    this.username.set('');
    this.displayName.set('');
    this.role.set('UNASSIGNED');
    this.packages.set([]);
    this.summary.set(null);
    this.selectedPackage.set(null);
    this.view.set('dashboard');
    this.initialPackageId.set(null);
    this.closeModal();
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => this.notice.set(''), 3500);
  }

  private getErrorMessage(error: any): string {
    if (error?.status === 0) return 'No se pudo conectar con el API. Revisa que esté disponible y que API Gateway permita el origen local.';
    if (error?.status === 401) return 'La sesión expiró o el token no fue aceptado. Vuelve a iniciar sesión.';
    if (error?.status === 403) return 'Tu grupo no tiene permiso para realizar esta acción.';
    return error?.error?.message || error?.error?.detail || error?.message || 'Ocurrió un error al procesar la solicitud.';
  }
}
