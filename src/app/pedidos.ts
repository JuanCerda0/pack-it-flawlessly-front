import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const URL_API_GATEWAY = 'https://puw984ilz0.execute-api.us-east-1.amazonaws.com/Dev/api/pedidos';

@Injectable({ providedIn: 'root' })
export class Pedidos {
  private readonly url = URL_API_GATEWAY;

  constructor(private http: HttpClient) {}

  obtenerPedidos(): Observable<any[]> {
    return this.http.get<any[]>(this.url);
  }
}
