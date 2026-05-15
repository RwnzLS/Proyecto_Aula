import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/auth.service';
import { Rol } from '../../core/models';
import { ThemeService } from '../../core/theme.service';
import { WorkspaceNavigationService } from '../../core/workspace-navigation.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { MovimientosComponent } from '../movimientos/movimientos.component';
import { OrdenesComponent } from '../ordenes/ordenes.component';
import { PreciosComponent } from '../precios/precios.component';
import { ProductosComponent } from '../productos/productos.component';
import { ProveedoresComponent } from '../proveedores/proveedores.component';
import { UsuariosComponent } from '../usuarios/usuarios.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    DashboardComponent,
    ProductosComponent,
    ProveedoresComponent,
    PreciosComponent,
    OrdenesComponent,
    MovimientosComponent,
    UsuariosComponent
  ],
  template: `
    <mat-toolbar color="primary" class="app-topbar">
      <div class="brand">
        <mat-icon>inventory_2</mat-icon>
        <div>
          <strong>Inventario</strong>
          <span>Gestion de proveedores</span>
        </div>
      </div>
      <span class="toolbar-spacer"></span>
      <div class="session-pill">
        <mat-icon>verified_user</mat-icon>
        <span>{{ auth.session()?.nombre }} - {{ auth.session()?.rol }}</span>
      </div>
      <button mat-icon-button class="theme-toggle" [title]="theme.label()" [attr.aria-label]="theme.label()" (click)="theme.toggle()">
        <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
      <button mat-icon-button title="Salir" (click)="auth.logout()"><mat-icon>logout</mat-icon></button>
    </mat-toolbar>

    <main class="page">
      <mat-tab-group class="workspace-tabs" animationDuration="160ms" [selectedIndex]="navigation.activeTab()" (selectedIndexChange)="navigation.go($event)">
        <mat-tab>
          <ng-template mat-tab-label><mat-icon>dashboard</mat-icon>Dashboard</ng-template>
          <ng-template matTabContent><app-dashboard /></ng-template>
        </mat-tab>
        <mat-tab>
          <ng-template mat-tab-label><mat-icon>category</mat-icon>Productos</ng-template>
          <ng-template matTabContent><app-productos /></ng-template>
        </mat-tab>
        @if (can(['ADMIN','GERENTE'])) {
          <mat-tab>
            <ng-template mat-tab-label><mat-icon>business</mat-icon>Proveedores</ng-template>
            <ng-template matTabContent><app-proveedores /></ng-template>
          </mat-tab>
          <mat-tab>
            <ng-template mat-tab-label><mat-icon>monitoring</mat-icon>Precios</ng-template>
            <ng-template matTabContent><app-precios /></ng-template>
          </mat-tab>
        }
        <mat-tab>
          <ng-template mat-tab-label><mat-icon>receipt_long</mat-icon>Ordenes</ng-template>
          <ng-template matTabContent><app-ordenes /></ng-template>
        </mat-tab>
        <mat-tab>
          <ng-template mat-tab-label><mat-icon>sync_alt</mat-icon>Movimientos</ng-template>
          <ng-template matTabContent><app-movimientos /></ng-template>
        </mat-tab>
        @if (can(['ADMIN'])) {
          <mat-tab>
            <ng-template mat-tab-label><mat-icon>group</mat-icon>Usuarios</ng-template>
            <ng-template matTabContent><app-usuarios /></ng-template>
          </mat-tab>
        }
      </mat-tab-group>
    </main>
  `
})
export class ShellComponent {
  constructor(public auth: AuthService, public theme: ThemeService, public navigation: WorkspaceNavigationService) {}

  can(roles: Rol[]) {
    return this.auth.hasRole(roles);
  }
}
