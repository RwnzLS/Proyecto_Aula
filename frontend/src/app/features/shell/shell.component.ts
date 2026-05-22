import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Rol } from '../../core/models';
import { ThemeService } from '../../core/theme.service';
import { KeyboardShortcutsService } from '../../shared/keyboard-shortcuts.service';
import { ShortcutsDialogComponent } from '../../shared/shortcuts-dialog.component';

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
      { label: 'Ordenes', icon: 'receipt_long', link: '/ordenes', roles: ['ADMIN', 'GERENTE', 'ALMACENISTA'] }
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
    MatDialogModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  template: `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>

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
      <button mat-icon-button class="theme-toggle" matTooltip="Atajos de teclado (?)" aria-label="Ver atajos de teclado" (click)="abrirAtajos()">
        <mat-icon>keyboard</mat-icon>
      </button>
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
                [ariaCurrentWhenActive]="'page'"
                (click)="onNavClick()">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            </mat-nav-list>
          </ng-container>
        </nav>
      </mat-sidenav>

      <mat-sidenav-content class="shell-content">
        <main class="page" id="main-content" tabindex="-1">
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
      transition: background var(--app-dur-base) var(--app-ease-out);
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

    main#main-content:focus { outline: none; }

    @media (max-width: 1023px) {
      .shell-sidenav { width: 280px; }
    }
  `]
})
export class ShellComponent implements OnInit {
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly shortcuts = inject(KeyboardShortcutsService);
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

  ngOnInit(): void {
    this.shortcuts.start();
    this.shortcuts.register('?', () => this.abrirAtajos());
    this.shortcuts.register('/', () => this.focusPrimerFiltro());
    this.shortcuts.register('esc', () => this.closeActiveOverlay());
    this.shortcuts.register('g d', () => this.go('/dashboard'));
    this.shortcuts.register('g p', () => this.go('/productos'));
    this.shortcuts.register('g m', () => this.go('/movimientos'));
    this.shortcuts.register('g s', () => this.go('/proveedores'));
    this.shortcuts.register('g r', () => this.go('/precios'));
    this.shortcuts.register('g o', () => this.go('/ordenes'));
    this.shortcuts.register('g u', () => this.go('/usuarios'));
  }

  toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }

  abrirAtajos(): void {
    if (this.dialog.openDialogs.some(ref => ref.componentInstance instanceof ShortcutsDialogComponent)) {
      return;
    }
    this.dialog.open(ShortcutsDialogComponent, {
      width: '520px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Atajos de teclado disponibles'
    });
  }

  private go(path: string): void {
    if (this.auth.session()) {
      this.router.navigateByUrl(path);
    }
  }

  private focusPrimerFiltro(): void {
    const root = document.getElementById('main-content');
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      '.filter-panel input, .filter-panel .mat-mdc-select-trigger, .filters-panel input, .filters-panel .mat-mdc-select-trigger'
    );
    target?.focus();
  }

  private closeActiveOverlay(): void {
    const dialogRef = this.dialog.openDialogs[this.dialog.openDialogs.length - 1];
    if (dialogRef && !dialogRef.disableClose) {
      dialogRef.close();
      return;
    }

    if (this.isMobile() && this.sidenavOpen()) {
      this.sidenavOpen.set(false);
    }
  }
}
