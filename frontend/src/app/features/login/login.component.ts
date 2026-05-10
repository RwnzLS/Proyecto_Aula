import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule],
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
            <mat-card-subtitle>Usa las credenciales iniciales del proyecto</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="submit()" class="login-form" autocomplete="off">
              <input class="autofill-decoy" tabindex="-1" autocomplete="username">
              <input class="autofill-decoy" tabindex="-1" type="password" autocomplete="current-password">

              @if (apiError) {
                <div class="login-error">{{ apiError }}</div>
              }

              <button mat-stroked-button type="button" class="demo-button" (click)="useDemoCredentials()">
                <mat-icon>key</mat-icon>
                Usar credenciales demo
              </button>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" name="inventario-demo-email" autocomplete="off" spellcheck="false">
              <mat-icon matSuffix>mail</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPass ? 'text' : 'password'" formControlName="password" name="inventario-demo-password" autocomplete="new-password">
              <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
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
    :host {
      display: block;
      min-height: 100vh;
    }

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
      grid-template-columns: minmax(0, 1fr) 430px;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--app-shadow-strong);
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
      border-radius: 6px;
      background: var(--app-surface-muted);
      color: var(--app-brand-strong);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0;
    }

    h1 {
      margin: 0;
      font-size: 42px;
      line-height: 1.08;
      letter-spacing: 0;
    }

    p {
      margin: 0;
      max-width: 460px;
      font-size: 17px;
      line-height: 1.55;
      color: var(--app-muted);
    }

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
      border-radius: 8px;
      background: var(--app-surface);
      font-size: 13px;
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

    mat-card-header {
      padding: 0 0 24px;
    }

    mat-card-title {
      color: var(--app-heading);
      font-size: 24px;
      letter-spacing: 0;
    }

    mat-card-subtitle {
      margin-top: 8px;
      color: var(--app-muted);
    }

    mat-card-content {
      padding: 0;
    }

    .login-form {
      display: grid;
      gap: 18px;
    }

    .autofill-decoy {
      position: fixed;
      left: -10000px;
      width: 1px;
      height: 1px;
      opacity: 0;
    }

    .demo-button {
      justify-content: start;
      height: 44px;
      border-color: var(--app-border-strong);
      color: var(--app-brand-strong);
    }

    .login-submit {
      height: 48px;
      font-weight: 700;
    }

    .login-error {
      padding: 12px 14px;
      border: 1px solid #ffcdd2;
      border-radius: 8px;
      color: #9f1d20;
      background: #fff4f4;
      line-height: 1.4;
    }

    @media (max-width: 820px) {
      .login-shell {
        padding: 18px;
      }

      .login-panel {
        grid-template-columns: 1fr;
      }

      .login-copy {
        padding: 32px;
      }

      h1 {
        font-size: 34px;
      }

      .login-card {
        padding: 32px;
      }
    }

    @media (max-width: 520px) {
      .login-copy {
        display: none;
      }

      .login-card {
        padding: 24px;
      }
    }
  `]
})
export class LoginComponent implements AfterViewInit {
  private readonly demoEmail = 'admin@inventario.local';
  private readonly demoPassword = 'password';
  loading = false;
  showPass = false;
  apiError = '';
  form = this.fb.nonNullable.group({
    email: [this.demoEmail, [Validators.required, Validators.email]],
    password: [this.demoPassword, Validators.required]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private snack: MatSnackBar) {}

  ngAfterViewInit() {
    setTimeout(() => this.useDemoCredentials(), 250);
  }

  useDemoCredentials() {
    this.form.setValue({ email: this.demoEmail, password: this.demoPassword });
    this.apiError = '';
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.apiError = '';
    this.auth.login(this.form.controls.email.value, this.form.controls.password.value).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.apiError = error.status === 0
          ? 'No se pudo conectar con el backend. Inicia la API en http://localhost:8080 y vuelve a intentar.'
          : 'Credenciales invalidas. Usa admin@inventario.local / password o revisa los datos cargados en MySQL.';
        this.snack.open(this.apiError, 'Cerrar', { duration: 4500 });
      }
    });
  }
}
