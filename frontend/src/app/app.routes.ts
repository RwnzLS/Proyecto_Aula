import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ShellComponent } from './features/shell/shell.component';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [roleGuard(['ADMIN', 'GERENTE', 'ALMACENISTA'])]
  },
  { path: '**', redirectTo: '' }
];
