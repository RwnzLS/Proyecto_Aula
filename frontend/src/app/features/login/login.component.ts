import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Rol } from '../../core/models';
import { AuthService } from '../../core/auth.service';
import { NotifyService } from '../../shared/notify.service';

interface DemoRole {
  rol: Rol;
  label: string;
  email: string;
  password: string;
  icon: string;
  note: string;
}

const DEMO_ROLES: DemoRole[] = [
  { rol: 'ADMIN', label: 'Admin', email: 'admin@inventario.local', password: 'password', icon: 'admin_panel_settings', note: 'Acceso completo (sembrado por defecto).' },
  { rol: 'GERENTE', label: 'Gerente', email: 'gerente@inventario.local', password: 'password', icon: 'business_center', note: 'Compras y precios. Crea el usuario desde Administracion.' },
  { rol: 'ALMACENISTA', label: 'Almacenista', email: 'almacenista@inventario.local', password: 'password', icon: 'inventory_2', note: 'Operacion y stock. Crea el usuario desde Administracion.' }
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule
  ],
  template: `
    <div class="login-shell">
      <section class="login-panel">
        <div class="login-copy">
          <span class="login-kicker">Montes</span>
          <h1>Inventario y Proveedores</h1>
          <p>Gestiona stock, ordenes de compra, proveedores y usuarios desde un solo tablero.</p>
          <div class="login-metrics">
            <span><strong>JWT</strong> API segura</span>
            <span><strong>MySQL</strong> datos reales</span>
            <span><strong>Angular</strong> SPA</span>
          </div>
        </div>

        <mat-card class="login-card">
          @if (loading) {
            <mat-progress-bar mode="indeterminate" />
          }
          <mat-card-header>
            <mat-card-title>Acceso al sistema</mat-card-title>
            <mat-card-subtitle>Selecciona un rol demo o ingresa tus credenciales</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="submit()" class="login-form" autocomplete="off" novalidate>
              <input class="autofill-decoy" tabindex="-1" autocomplete="username">
              <input class="autofill-decoy" tabindex="-1" type="password" autocomplete="current-password">

              <div class="role-badges" role="group" aria-label="Credenciales demo por rol">
                <button
                  type="button"
                  *ngFor="let demo of demoRoles"
                  class="role-badge"
                  [class.role-badge--active]="activeRole === demo.rol"
                  [attr.aria-pressed]="activeRole === demo.rol"
                  [title]="demo.note"
                  (click)="useDemoCredentials(demo)">
                  <mat-icon>{{ demo.icon }}</mat-icon>
                  <span>{{ demo.label }}</span>
                </button>
              </div>

              <p class="role-note" aria-live="polite">{{ activeNote }}</p>

              <div class="login-error" *ngIf="apiError" role="alert" aria-live="assertive">{{ apiError }}</div>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input #emailInput matInput type="email" formControlName="email" name="inventario-demo-email" autocomplete="off" spellcheck="false" aria-describedby="email-error">
                <mat-icon matSuffix>mail</mat-icon>
                <mat-error id="email-error" *ngIf="form.controls.email.touched && form.controls.email.hasError('required')">El email es obligatorio.</mat-error>
                <mat-error *ngIf="form.controls.email.touched && form.controls.email.hasError('email')">Formato de email invalido.</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput [type]="showPass ? 'text' : 'password'" formControlName="password" name="inventario-demo-password" autocomplete="new-password" aria-describedby="password-error">
                <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass" [attr.aria-label]="showPass ? 'Ocultar password' : 'Mostrar password'">
                  <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error id="password-error" *ngIf="form.controls.password.touched && form.controls.password.hasError('required')">La password es obligatoria.</mat-error>
              </mat-form-field>
              <button mat-raised-button color="primary" class="login-submit" type="submit" [disabled]="form.invalid || loading">
                <mat-icon>login</mat-icon>
                Entrar
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .login-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px;
      background:
        radial-gradient(circle at 12% 10%, var(--app-bg-a), transparent 32rem),
        radial-gradient(circle at 86% 4%, var(--app-bg-b), transparent 36rem),
        radial-gradient(circle at 74% 92%, var(--app-bg-c), transparent 34rem),
        linear-gradient(180deg, var(--app-bg), var(--app-surface-soft));
    }

    .login-panel {
      width: min(980px, 100%);
      min-height: 520px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 440px;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-4);
      overflow: hidden;
      box-shadow: var(--app-shadow-strong);
      animation: login-rise var(--app-dur-slow) var(--app-ease-out) both;
    }

    @keyframes login-rise {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .login-copy {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 18px;
      padding: 56px;
      color: var(--app-heading);
      background:
        radial-gradient(circle at 20% 15%, var(--app-bg-a), transparent 24rem),
        linear-gradient(160deg, var(--app-surface-muted), var(--app-surface-soft));
    }

    .login-kicker {
      width: fit-content;
      padding: 6px 10px;
      border-radius: var(--app-radius-2);
      background: var(--app-surface-muted);
      color: var(--app-brand-strong);
      font-weight: var(--app-weight-bold);
      text-transform: uppercase;
      font-size: var(--app-font-12);
      letter-spacing: 0;
    }

    h1 { margin: 0; font-size: 42px; line-height: 1.08; }
    p { margin: 0; max-width: 460px; font-size: 17px; line-height: 1.55; color: var(--app-muted); }

    .login-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 20px;
    }

    .login-metrics span {
      min-height: 64px;
      display: grid;
      align-content: center;
      gap: 4px;
      padding: 12px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-3);
      background: var(--app-surface);
      font-size: var(--app-font-13);
      color: var(--app-muted);
    }

    .login-metrics strong {
      color: var(--app-brand-strong);
      font-size: 15px;
    }

    .login-card {
      width: 100%;
      border-radius: 0 !important;
      box-shadow: none;
      display: flex;
      justify-content: center;
      background: var(--app-surface);
      padding: 40px;
    }

    mat-card-header { padding: 0 0 24px; }
    mat-card-title { color: var(--app-heading); font-size: 24px; letter-spacing: 0; }
    mat-card-subtitle { margin-top: 8px; color: var(--app-muted); }
    mat-card-content { padding: 0; }

    .login-form { display: grid; gap: 16px; }

    .autofill-decoy {
      position: fixed;
      left: -10000px;
      width: 1px;
      height: 1px;
      opacity: 0;
    }

    .role-badges {
      display: flex;
      gap: var(--app-space-2);
      flex-wrap: wrap;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-2);
      padding: 8px 12px;
      border-radius: var(--app-radius-pill);
      border: 1px solid var(--app-border-strong);
      background: var(--app-surface);
      color: var(--app-muted-strong);
      font-weight: var(--app-weight-semibold);
      font-size: var(--app-font-13);
      cursor: pointer;
      transition: background var(--app-dur-fast) var(--app-ease-out),
                  color var(--app-dur-fast) var(--app-ease-out),
                  border-color var(--app-dur-fast) var(--app-ease-out);
    }

    .role-badge:hover {
      background: var(--app-surface-muted);
      color: var(--app-brand-strong);
      border-color: var(--app-brand);
    }

    .role-badge--active {
      background: var(--app-brand);
      color: #ffffff;
      border-color: var(--app-brand);
    }

    .role-badge--active mat-icon { color: #ffffff; }

    .role-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .role-note {
      min-height: 18px;
      margin: 0;
      font-size: var(--app-font-12);
      color: var(--app-muted);
    }

    .login-submit { height: 48px; font-weight: var(--app-weight-bold); }

    .login-error {
      padding: 12px 14px;
      border: 1px solid rgba(176, 56, 50, 0.32);
      border-radius: var(--app-radius-3);
      color: var(--app-danger);
      background: rgba(176, 56, 50, 0.08);
      line-height: 1.4;
      font-size: var(--app-font-13);
    }

    @media (max-width: 820px) {
      .login-shell { padding: 18px; }
      .login-panel { grid-template-columns: 1fr; }
      .login-copy { padding: 32px; }
      h1 { font-size: 34px; }
      .login-card { padding: 32px; }
    }

    @media (max-width: 520px) {
      .login-copy { display: none; }
      .login-card { padding: 24px; }
    }
  `]
})
export class LoginComponent implements AfterViewInit {
  readonly demoRoles = DEMO_ROLES;
  loading = false;
  showPass = false;
  apiError = '';
  activeRole: Rol | null = 'ADMIN';
  activeNote = DEMO_ROLES[0].note;

  form = this.fb.nonNullable.group({
    email: [DEMO_ROLES[0].email, [Validators.required, Validators.email]],
    password: [DEMO_ROLES[0].password, Validators.required]
  });

  @ViewChild('emailInput') emailInput?: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private notify: NotifyService
  ) {}

  ngAfterViewInit() {
    setTimeout(() => this.emailInput?.nativeElement.focus(), 200);
  }

  useDemoCredentials(demo: DemoRole) {
    this.form.setValue({ email: demo.email, password: demo.password });
    this.activeRole = demo.rol;
    this.activeNote = demo.note;
    this.apiError = '';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.apiError = '';
    this.auth.login(this.form.controls.email.value, this.form.controls.password.value).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.apiError = error.status === 0
          ? 'No se pudo conectar con el backend. Inicia la API en http://localhost:8080 y vuelve a intentar.'
          : 'Credenciales invalidas. Usa admin@inventario.local / password o crea el usuario desde Administracion.';
        this.notify.error(this.apiError);
      }
    });
  }
}
