import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ShellComponent } from './features/shell/shell.component';
import { roleGuard } from './core/role.guard';

const ALL_ROLES = ['ADMIN', 'GERENTE', 'ALMACENISTA'] as const;
const ADMIN_GERENTE = ['ADMIN', 'GERENTE'] as const;
const ADMIN_ONLY = ['ADMIN'] as const;
const ADMIN_ALMACENISTA = ['ADMIN', 'ALMACENISTA'] as const;

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [roleGuard([...ALL_ROLES])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [roleGuard([...ALL_ROLES])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'productos',
        canActivate: [roleGuard([...ALL_ROLES])],
        loadComponent: () =>
          import('./features/productos/productos.component').then(m => m.ProductosComponent)
      },
      {
        path: 'movimientos',
        canActivate: [roleGuard([...ADMIN_ALMACENISTA, 'GERENTE'])],
        loadComponent: () =>
          import('./features/movimientos/movimientos.component').then(m => m.MovimientosComponent)
      },
      {
        path: 'proveedores',
        canActivate: [roleGuard([...ADMIN_GERENTE])],
        loadComponent: () =>
          import('./features/proveedores/proveedores.component').then(m => m.ProveedoresComponent)
      },
      {
        path: 'precios',
        canActivate: [roleGuard([...ADMIN_GERENTE])],
        loadComponent: () =>
          import('./features/precios/precios.component').then(m => m.PreciosComponent)
      },
      {
        path: 'ordenes',
        canActivate: [roleGuard([...ALL_ROLES])],
        loadComponent: () =>
          import('./features/ordenes/ordenes.component').then(m => m.OrdenesComponent)
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard([...ADMIN_ONLY])],
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
