import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { Rol } from './models';

export interface Session { nombre: string; email: string; rol: Rol; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'inventario.session';
  // localStorage es solo una pista de arranque; la fuente de verdad es la cookie HttpOnly,
  // que el cliente no puede leer y se valida contra el backend con verifySession().
  private readonly sessionSignal = signal<Session | null>(this.readSession());
  private loggingOut = false;
  readonly session = this.sessionSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.sessionSignal());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    // El backend responde con el JWT en una cookie HttpOnly; el cuerpo solo trae datos de la sesion.
    return this.http.post<Session>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(session => this.storeSession(session))
    );
  }

  /**
   * Revalida la sesion contra el backend (la cookie HttpOnly debe seguir viva). Se usa al
   * arrancar la app: si la cookie expiro o falta, descarta la sesion local sin redirigir
   * ni notificar, evitando la cascada de errores "Sesion expirada" en cada peticion.
   */
  verifySession(): Observable<Session | null> {
    return this.http.get<Session>(`${environment.apiUrl}/auth/session`).pipe(
      timeout(5000),
      tap(session => this.storeSession(session)),
      catchError(() => {
        this.clearLocalSession();
        return of(null);
      })
    );
  }

  logout() {
    if (this.loggingOut) {
      this.clearSession();
      return;
    }
    this.loggingOut = true;
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

  private storeSession(session: Session) {
    localStorage.setItem(this.key, JSON.stringify(session));
    this.sessionSignal.set(session);
  }

  private clearLocalSession() {
    localStorage.removeItem(this.key);
    this.sessionSignal.set(null);
    this.loggingOut = false;
  }

  private clearSession() {
    this.clearLocalSession();
    this.router.navigateByUrl('/login');
  }

  private readSession(): Session | null {
    if (this.shouldResetSessionFromUrl()) {
      localStorage.removeItem(this.key);
      return null;
    }
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as Partial<Session>;
      if (
        typeof session.nombre === 'string' &&
        typeof session.email === 'string' &&
        (session.rol === 'ADMIN' || session.rol === 'GERENTE' || session.rol === 'ALMACENISTA')
      ) {
        return session as Session;
      }
    } catch {
      // Sesiones antiguas o corruptas no deben romper el bootstrap de Angular.
    }
    localStorage.removeItem(this.key);
    return null;
  }

  private shouldResetSessionFromUrl(): boolean {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('resetSession');
  }
}
