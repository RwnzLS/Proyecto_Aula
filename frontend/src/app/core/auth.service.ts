import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Rol } from './models';

export interface Session { nombre: string; email: string; rol: Rol; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'inventario.session';
  private readonly sessionSignal = signal<Session | null>(this.readSession());
  readonly session = this.sessionSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.sessionSignal());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    // El backend responde con el JWT en una cookie HttpOnly; el cuerpo solo trae datos de la sesion.
    return this.http.post<Session>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(session => {
        localStorage.setItem(this.key, JSON.stringify(session));
        this.sessionSignal.set(session);
      })
    );
  }

  logout() {
    // El backend limpia la cookie HttpOnly; pase lo que pase se descarta la sesion local.
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  hasRole(roles: Rol[]) {
    const current = this.sessionSignal();
    return !!current && roles.includes(current.rol);
  }

  private clearSession() {
    localStorage.removeItem(this.key);
    this.sessionSignal.set(null);
    this.router.navigateByUrl('/login');
  }

  private readSession(): Session | null {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) as Session : null;
  }
}
