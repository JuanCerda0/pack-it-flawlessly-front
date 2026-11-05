import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiRoots } from './api-endpoints';
import { DocumentsApi } from './documents-api';
import { HistoryApi } from './history-api';

describe('Historial y Documentos API', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta el historial del paquete seleccionado', () => {
    let received = false;
    TestBed.inject(HistoryApi).listForPackage(43).subscribe(entries => {
      expect(entries).toEqual([]);
      received = true;
    });
    http.expectOne(`${apiRoots.history}/packages/43/history`).flush([]);
    expect(received).toBe(true);
  });

  it('consulta los documentos y descarga el PDF como blob', () => {
    const api = TestBed.inject(DocumentsApi);
    api.listForPackage(43).subscribe(documents => expect(documents).toEqual([]));
    http.expectOne(`${apiRoots.documents}/packages/43/documents`).flush([]);

    const pdf = new Blob(['%PDF'], { type: 'application/pdf' });
    api.getFile(8).subscribe(file => expect(file).toBe(pdf));
    const request = http.expectOne(`${apiRoots.documents}/documents/8/file`);
    expect(request.request.responseType).toBe('blob');
    expect(request.request.headers.get('Accept')).toBe('application/pdf');
    request.flush(pdf);
  });
});
