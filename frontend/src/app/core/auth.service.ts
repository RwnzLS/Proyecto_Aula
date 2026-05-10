import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Rol } from './models';

interface LoginResponse { token: string; nombre: string; email: string; rol: Rol; }
export interface Session { token: string; nombre: string; email: string; rol: Rol; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'inventario.session';
  private readonly sessionSignal = signal<Session | null>(this.readSession());
  readonly session = this.sessionSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.sessionSignal());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem(this.key, JSON.stringify(response));
        this.sessionSignal.set(response);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.key);
    this.sessionSignal.set(null);
    this.router.navigateByUrl('/login');
  }

  hasRole(roles: Rol[]) {
    const current = this.sessionSignal();
    return !!current && roles.includes(current.rol);
  }

  token() {
    return this.sessionSignal()?.token;
  }

  private readSession(): Session | null {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) as Session : null;
  }
}
