import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jest.Mocked<Pick<Router, 'navigateByUrl'>>;

  beforeEach(() => {
    routerSpy = { navigateByUrl: jest.fn().mockResolvedValue(true) };
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('logout() idempotencia — evitar cascada', () => {
    it('debería hacer solo 1 POST /auth/logout cuando se llama dos veces seguidas', () => {
      // Llamar logout dos veces (simula múltiples 401 simultáneos)
      service.logout();
      service.logout();

      // Solo debería haber 1 petición HTTP en vuelo
      const requests = httpMock.match(`${environment.apiUrl}/auth/logout`);
      expect(requests.length).toBe(1);

      // Resolver la petición
      requests[0].flush(null);

      // Verificar que se limpió la sesión y navegó a /login
      expect(service.isLoggedIn()).toBe(false);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
    });

    it('debería limpiar sesión inmediatamente en la segunda llamada (sin esperar HTTP)', () => {
      // Simular una sesión activa guardada
      localStorage.setItem('inventario.session', JSON.stringify({
        nombre: 'Test', email: 'test@test.com', rol: 'ADMIN'
      }));

      // Re-crear el servicio para que lea la sesión del localStorage
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthService,
          { provide: Router, useValue: routerSpy }
        ]
      });
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);

      expect(service.isLoggedIn()).toBe(true);

      service.logout();  // Primera: dispara HTTP
      service.logout();  // Segunda: clearSession directa (flag activo)

      // La segunda llamada ya debería haber limpiado la sesión
      expect(service.isLoggedIn()).toBe(false);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');

      // Completar la primera petición HTTP pendiente
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush(null);
    });

    it('debería resetear el flag loggingOut tras clearSession, permitiendo un logout futuro', () => {
      // Primer ciclo de logout completo
      service.logout();
      const req1 = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req1.flush(null);

      // Segundo ciclo de logout (debería funcionar normalmente, no estar bloqueado)
      service.logout();
      const req2 = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req2.flush(null);

      // Ambos ciclos deben haber navegado a /login
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
      expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(2);
    });

    it('debería limpiar sesión aunque el POST /auth/logout falle con error', () => {
      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush(null, { status: 500, statusText: 'Server Error' });

      expect(service.isLoggedIn()).toBe(false);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
    });
  });
});
