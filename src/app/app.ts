import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JsonPipe } from '@angular/common';
import {
  signInWithRedirect,
  signOut,
  fetchAuthSession,
  getCurrentUser
} from 'aws-amplify/auth';
import { Pedidos } from './pedidos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('pedidos360-front');

  usuario = '';
  token = '';
  autenticado = false;

  pedidos: any[] = [];
  cargandoPedidos = false;
  errorPedidos = '';

  constructor(private pedidosService: Pedidos) {}

  async login() {
    await signInWithRedirect();
  }

  async logout() {
    await signOut();
  }

  async verSesion() {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      this.usuario = user.username;
      this.token = session.tokens?.accessToken?.toString() ?? '';
      this.autenticado = true;
    } catch (error) {
      console.log('No existe sesión', error);
      this.autenticado = false;
    }
  }

  consultarPedidos() {
    this.cargandoPedidos = true;
    this.errorPedidos = '';
    this.pedidosService.obtenerPedidos().subscribe({
      next: data => {
        this.pedidos = data;
        this.cargandoPedidos = false;
      },
      error: error => {
        console.error(error);
        this.errorPedidos = 'No fue posible consultar pedidos';
        this.cargandoPedidos = false;
      }
    });
  }
}
