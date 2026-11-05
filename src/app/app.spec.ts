import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { vi } from 'vitest';

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('Signed out')),
  fetchAuthSession: vi.fn().mockResolvedValue({}),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient()],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the local login screen', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.login-card h1')?.textContent).toContain('Todo en su lugar.');
    });
  });

  it('shows consultation views to supervisors without package write controls', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.checkingSession()).toBe(false));

    fixture.componentInstance.authenticated.set(true);
    fixture.componentInstance.role.set('SUPERVISOR');
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.side-nav')?.textContent).toContain('Historial');
    expect(page.querySelector('.side-nav')?.textContent).toContain('Documentos');
    expect(page.textContent).not.toContain('Crear paquete');

    fixture.componentInstance.role.set('ADMIN');
    fixture.detectChanges();
    expect(page.textContent).toContain('Crear paquete');
  });
});
