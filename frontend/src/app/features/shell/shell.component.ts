import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Rol } from '../../core/models';
import { ThemeService } from '../../core/theme.service';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  roles: Rol[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operacion',
    items: [
      { label: 'Dashboard', icon: 'dashboard', link: '/dashboard', roles: ['ADMIN', 'GERENTE', 'ALMACENISTA'] },
      { label: 'Productos', icon: 'category', link: '/productos', roles: ['ADMIN', 'GERENTE', 'ALMACENISTA'] },
      { label: 'Movimientos', icon: 'sync_alt', link: '/movimientos', roles: ['ADMIN', 'GERENTE', 'ALMACENISTA'] }
    ]
  },
  {
    label: 'Compras',
    items: [
      { label: 'Proveedores', icon: 'business', link: '/proveedores', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Precios', icon: 'monitoring', link: '/precios', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Ordenes', icon: 'receipt_long', link: '/ordenes', roles: ['ADMIN', 'GERENTE'] }
    ]
  },
  {
    label: 'Administracion',
    items: [
      { label: 'Usuarios', icon: 'group', link: '/usuarios', roles: ['ADMIN'] }
    ]
  }
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  template: `
    <mat-toolbar color="primary" class="app-topbar">
      <button
        *ngIf="isMobile()"
        mat-icon-button
        class="nav-toggle"
        aria-label="Abrir navegacion"
        (click)="toggleSidenav()">
        <mat-icon>menu</mat-icon>
      </button>
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
      <button mat-icon-button title="Salir" aria-label="Cerrar sesion" (click)="auth.logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <mat-sidenav-container class="shell-container" autosize>
      <mat-sidenav
        #sidenav
        class="shell-sidenav"
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile() || sidenavOpen()"
        (closedStart)="sidenavOpen.set(false)">
        <nav class="shell-nav" aria-label="Navegacion principal">
          <ng-container *ngFor="let group of visibleGroups()">
            <h3 class="shell-nav__group">{{ group.label }}</h3>
            <mat-nav-list>
              <a
                mat-list-item
                *ngFor="let item of group.items"
                [routerLink]="item.link"
                routerLinkActive="shell-nav__item--active"
                (click)="onNavClick()">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            </mat-nav-list>
          </ng-container>
        </nav>
      </mat-sidenav>

      <mat-sidenav-content class="shell-content">
        <main class="page" id="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; }

    .shell-container {
      min-height: calc(100vh - 64px);
      background: transparent;
    }

    .shell-sidenav {
      width: 264px;
      border-right: 1px solid var(--app-border);
      background: var(--app-surface);
      padding: var(--app-space-4) 0 var(--app-space-6);
    }

    .shell-nav {
      display: flex;
      flex-direction: column;
      gap: var(--app-space-3);
    }

    .shell-nav__group {
      margin: var(--app-space-3) var(--app-space-5) 0;
      font-size: var(--app-font-12);
      font-weight: var(--app-weight-bold);
      letter-spacing: var(--app-tracking-wide);
      text-transform: uppercase;
      color: var(--app-muted);
    }

    .shell-nav .mdc-list-item__primary-text,
    .shell-nav .mat-icon {
      color: var(--app-text);
    }

    .shell-nav .mat-mdc-list-item {
      border-radius: var(--app-radius-3);
      margin: 0 var(--app-space-3);
      transition: background var(--app-dur-fast) var(--app-ease-out);
    }

    .shell-nav .mat-mdc-list-item:hover {
      background: var(--app-surface-muted);
    }

    .shell-nav__item--active {
      background: var(--app-surface-muted) !important;
    }

    .shell-nav__item--active .mdc-list-item__primary-text,
    .shell-nav__item--active .mat-icon {
      color: var(--app-brand-strong);
      font-weight: var(--app-weight-bold);
    }

    .shell-content {
      background: transparent;
    }

    .nav-toggle {
      margin-right: var(--app-space-2);
    }

    @media (max-width: 1023px) {
      .shell-sidenav { width: 280px; }
    }
  `]
})
export class ShellComponent {
  private readonly breakpoint = inject(BreakpointObserver);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly isMobile = toSignal(
    this.breakpoint.observe('(max-width: 1023px)').pipe(map(state => state.matches)),
    { initialValue: false }
  );

  readonly sidenavOpen = signal(false);

  readonly visibleGroups = computed<NavGroup[]>(() =>
    NAV_GROUPS
      .map(group => ({ ...group, items: group.items.filter(item => this.auth.hasRole(item.roles)) }))
      .filter(group => group.items.length > 0)
  );

  toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }
}
