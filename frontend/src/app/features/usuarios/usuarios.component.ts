import { DatePipe, CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { Page, Rol, UsuarioResponse } from '../../core/models';
import { ConfirmService } from '../../shared/confirm.service';
import { NotifyService } from '../../shared/notify.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

const ROL_META: Record<Rol, { label: string; icon: string; chipClass: string }> = {
  ADMIN: { label: 'Admin', icon: 'admin_panel_settings', chipClass: 'chip-rol chip-rol--admin' },
  GERENTE: { label: 'Gerente', icon: 'workspace_premium', chipClass: 'chip-rol chip-rol--gerente' },
  ALMACENISTA: { label: 'Almacenista', icon: 'inventory', chipClass: 'chip-rol chip-rol--almacenista' }
};

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  template: `
    <section class="module-page">
      <app-page-header eyebrow="Administracion" title="Usuarios" subtitle="Crea usuarios y activa o suspende accesos del sistema.">
        <button actions mat-stroked-button type="button" (click)="loadUsuarios()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </app-page-header>

      <div class="form-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Crear usuario</h2>
            <p>Genera una password temporal o escribela manualmente.</p>
          </div>
          <button mat-stroked-button type="button" (click)="limpiarFormulario()" matTooltip="Reiniciar formulario">
            <mat-icon>backspace</mat-icon>
            Limpiar
          </button>
        </div>
        <form [formGroup]="usuarioForm" (ngSubmit)="crearUsuario()" class="grid form-grid" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" cdkFocusInitial>
            <mat-error *ngIf="usuarioForm.controls.nombre.hasError('required')">Nombre obligatorio.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-error *ngIf="usuarioForm.controls.email.hasError('required')">Email obligatorio.</mat-error>
            <mat-error *ngIf="usuarioForm.controls.email.hasError('email')">Email invalido.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="password-field">
            <mat-label>Password temporal</mat-label>
            <input matInput [type]="mostrarPassword ? 'text' : 'password'" formControlName="password">
            <button mat-icon-button matSuffix type="button" (click)="mostrarPassword = !mostrarPassword" [attr.aria-label]="mostrarPassword ? 'Ocultar password' : 'Mostrar password'">
              <mat-icon>{{ mostrarPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>Minimo 8 caracteres.</mat-hint>
            <mat-error *ngIf="usuarioForm.controls.password.hasError('required')">Password obligatoria.</mat-error>
            <mat-error *ngIf="usuarioForm.controls.password.hasError('minlength')">Minimo 8 caracteres.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Rol</mat-label>
            <mat-select formControlName="rol">
              <mat-option value="ADMIN">Admin</mat-option>
              <mat-option value="GERENTE">Gerente</mat-option>
              <mat-option value="ALMACENISTA">Almacenista</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="form-actions">
            <button mat-stroked-button type="button" (click)="generarPassword()" matTooltip="Generar password aleatorio">
              <mat-icon>auto_awesome</mat-icon>
              Generar
            </button>
            <button mat-raised-button color="primary" type="submit" [disabled]="usuarioForm.invalid || saving">
              <mat-icon>person_add</mat-icon>
              Crear
            </button>
          </div>
        </form>
      </div>

      @if (loading) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="data-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Usuarios registrados</h2>
            <p>{{ totalUsuarios() }} cuentas encontradas</p>
          </div>
          <span class="count-pill">{{ usuarios.length }}</span>
        </div>
        @if (usuarios.length) {
          <div class="table-wrap">
            <table mat-table [dataSource]="usuarios">
              <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th><td mat-cell *matCellDef="let u">{{ u.nombre }}</td></ng-container>
              <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let u">{{ u.email }}</td></ng-container>
              <ng-container matColumnDef="rol">
                <th mat-header-cell *matHeaderCellDef>Rol</th>
                <td mat-cell *matCellDef="let u">
                  <mat-chip [class]="rolMeta(u.rol).chipClass" disableRipple>
                    <mat-icon class="chip-icon">{{ rolMeta(u.rol).icon }}</mat-icon>
                    {{ rolMeta(u.rol).label }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="activo">
                <th mat-header-cell *matHeaderCellDef>Activo</th>
                <td mat-cell *matCellDef="let u">
                  <mat-slide-toggle [checked]="u.activo" (change)="toggleActivo(u, $event.checked)" />
                </td>
              </ng-container>
              <ng-container matColumnDef="fechaCreacion"><th mat-header-cell *matHeaderCellDef>Creado</th><td mat-cell *matCellDef="let u">{{ u.fechaCreacion | date:'short' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="usuarioCols"></tr>
              <tr mat-row *matRowDef="let row; columns: usuarioCols;"></tr>
            </table>
            <mat-paginator [length]="usuariosPage?.totalElements ?? 0" [pageIndex]="pageIndex" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]" (page)="onPage($event)" />
          </div>
        } @else {
          <app-empty-state icon="group" title="No hay usuarios registrados" message="Crea una cuenta para que aparezca en la lista." />
        }
      </div>
    </section>
  `,
  styles: [`
    .password-field { grid-column: span 2; }
    .form-actions {
      display: flex;
      align-items: center;
      gap: var(--app-space-3);
      flex-wrap: wrap;
    }

    .chip-rol {
      gap: 6px;
      font-weight: var(--app-weight-semibold);
      font-size: var(--app-font-12);
    }
    .chip-rol .chip-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 0; }
    .chip-rol--admin {
      --mdc-chip-elevated-container-color: color-mix(in srgb, var(--app-danger) 16%, var(--app-surface));
      color: var(--app-danger);
    }
    .chip-rol--gerente {
      --mdc-chip-elevated-container-color: color-mix(in srgb, var(--app-accent) 16%, var(--app-surface));
      color: var(--app-accent);
    }
    .chip-rol--almacenista {
      --mdc-chip-elevated-container-color: color-mix(in srgb, var(--app-success) 16%, var(--app-surface));
      color: var(--app-success);
    }

    @media (max-width: 720px) {
      .password-field { grid-column: auto; }
    }
  `]
})
export class UsuariosComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotifyService);
  private readonly confirmService = inject(ConfirmService);

  loading = false;
  saving = false;
  usuarios: UsuarioResponse[] = [];
  usuariosPage?: Page<UsuarioResponse>;
  pageIndex = 0;
  pageSize = 20;
  usuarioCols = ['nombre', 'email', 'rol', 'activo', 'fechaCreacion'];
  mostrarPassword = false;
  usuarioForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rol: ['ALMACENISTA' as Rol, Validators.required],
    activo: [true]
  });

  ngOnInit() {
    this.loadUsuarios();
  }

  rolMeta(rol: Rol) {
    return ROL_META[rol];
  }

  loadUsuarios(page = this.pageIndex, size = this.pageSize) {
    this.pageIndex = page;
    this.pageSize = size;
    this.loading = true;
    this.api.usuarios({ page, size }).subscribe({
      next: usuariosPage => {
        this.usuariosPage = usuariosPage;
        this.usuarios = usuariosPage.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPage(event: PageEvent) {
    this.loadUsuarios(event.pageIndex, event.pageSize);
  }

  limpiarFormulario() {
    this.usuarioForm.reset({ nombre: '', email: '', password: '', rol: 'ALMACENISTA', activo: true });
    this.mostrarPassword = false;
  }

  totalUsuarios() {
    return this.usuariosPage?.totalElements ?? this.usuarios.length;
  }

  generarPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const symbols = '!@#$%&*';
    const random = (size: number) => crypto.getRandomValues(new Uint32Array(size));
    const buffer = random(11);
    let out = '';
    for (let i = 0; i < 10; i++) {
      out += alphabet.charAt(buffer[i] % alphabet.length);
    }
    out += symbols.charAt(buffer[10] % symbols.length);
    this.usuarioForm.patchValue({ password: out });
    this.mostrarPassword = true;
    this.notify.info('Password generada, recuerda copiarla antes de crear el usuario.');
  }

  crearUsuario() {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.api.crearUsuario(this.usuarioForm.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Usuario creado');
        this.limpiarFormulario();
        this.saving = false;
        this.loadUsuarios();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  async toggleActivo(usuario: UsuarioResponse, activo: boolean) {
    const accion = activo ? 'activar' : 'suspender';
    const ok = await this.confirmService.confirm({
      title: `${activo ? 'Activar' : 'Suspender'} usuario`,
      message: `Vas a ${accion} a ${usuario.nombre}. Continuar?`,
      confirmLabel: activo ? 'Activar' : 'Suspender',
      variant: activo ? 'default' : 'danger'
    });
    if (!ok) {
      this.usuarios = this.usuarios.map(current =>
        current.id === usuario.id ? { ...current, activo: !activo } : current
      );
      return;
    }
    this.api.toggleUsuario(usuario.id, activo).subscribe({
      next: updated => {
        this.usuarios = this.usuarios.map(current => current.id === updated.id ? updated : current);
        activo ? this.notify.success('Usuario activado') : this.notify.warning('Usuario suspendido');
      },
      error: () => {
        this.usuarios = this.usuarios.map(current =>
          current.id === usuario.id ? { ...current, activo: !activo } : current
        );
      }
    });
  }
}
