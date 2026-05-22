import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService, Session } from './auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let authSpy: { hasRole: jest.Mock; session: jest.Mock };
  let routerSpy: jest.Mocked<Pick<Router, 'createUrlTree'>>;
  const loginTree = {} as UrlTree;
  const dashboardTree = {} as UrlTree;

  beforeEach(() => {
    authSpy = {
      hasRole: jest.fn(),
      session: jest.fn()
    };
    routerSpy = {
      createUrlTree: jest.fn(path => path[0] === '/dashboard' ? dashboardTree : loginTree)
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('permite pasar cuando el usuario tiene uno de los roles requeridos', () => {
    authSpy.hasRole.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => roleGuard(['ADMIN'])({} as never, {} as never));

    expect(result).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirige a login cuando no hay sesion', () => {
    authSpy.hasRole.mockReturnValue(false);
    authSpy.session.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() => roleGuard(['ADMIN'])({} as never, {} as never));

    expect(result).toBe(loginTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('redirige al dashboard cuando hay sesion pero no rol suficiente', () => {
    const session: Session = { nombre: 'Ana', email: 'ana@test.com', rol: 'ALMACENISTA' };
    authSpy.hasRole.mockReturnValue(false);
    authSpy.session.mockReturnValue(session);

    const result = TestBed.runInInjectionContext(() => roleGuard(['ADMIN'])({} as never, {} as never));

    expect(result).toBe(dashboardTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
