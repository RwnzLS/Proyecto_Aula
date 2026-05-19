import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor, credentialsInterceptor } from './interceptors';
import { AuthService } from './auth.service';
import { NotifyService } from '../shared/notify.service';
import { environment } from '../../environments/environment';

describe('errorInterceptor — exclusión de endpoints auth', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: jest.Mocked<Pick<AuthService, 'logout'>>;
  let notifySpy: jest.Mocked<Pick<NotifyService, 'warning' | 'error'>>;

  beforeEach(() => {
    authSpy = { logout: jest.fn() };
    notifySpy = { warning: jest.fn(), error: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: NotifyService, useValue: notifySpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debería disparar logout para un 401 en un endpoint normal', () => {
    http.get(`${environment.apiUrl}/productos`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/productos`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).toHaveBeenCalledTimes(1);
    expect(notifySpy.warning).toHaveBeenCalledWith('Sesion expirada');
  });

  it('NO debería disparar logout para un 401 en /auth/login', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).not.toHaveBeenCalled();
    expect(notifySpy.warning).not.toHaveBeenCalled();
  });

  it('NO debería disparar logout para un 401 en /auth/logout', () => {
    http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).not.toHaveBeenCalled();
    expect(notifySpy.warning).not.toHaveBeenCalled();
  });

  it('NO debería disparar logout para un 401 en /auth/login con query params', () => {
    http.post(`${environment.apiUrl}/auth/login?redirect=dashboard`, {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login?redirect=dashboard`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).not.toHaveBeenCalled();
  });

  it('debería mostrar warning para un 403', () => {
    http.get(`${environment.apiUrl}/usuarios`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios`);
    req.flush(null, { status: 403, statusText: 'Forbidden' });

    expect(notifySpy.warning).toHaveBeenCalledWith('No tienes permisos para esta accion');
    expect(authSpy.logout).not.toHaveBeenCalled();
  });
});
