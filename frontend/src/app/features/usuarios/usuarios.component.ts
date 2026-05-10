import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { Page, Rol, UsuarioResponse } from '../../core/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule
  ],
  template: `
    <section class="module-page">
      <div class="module-hero">
        <div class="module-title">
          <span class="eyebrow">Administracion</span>
          <h1>Usuarios</h1>
          <p>Crea usuarios y activa o suspende accesos del sistema.</p>
        </div>
        <div class="module-actions">
          <button mat-stroked-button type="button" (click)="loadUsuarios()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      <div class="form-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Crear usuario</h2>
            <p>El password temporal se envia al correo configurado.</p>
          </div>
          <button mat-stroked-button type="button" (click)="limpiarFormulario()">
            <mat-icon>backspace</mat-icon>
            Limpiar
          </button>
        </div>
        <form [formGroup]="usuarioForm" (ngSubmit)="crearUsuario()" class="grid form-grid">
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Password temporal</mat-label><input matInput type="password" formControlName="password"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Rol</mat-label>
            <mat-select formControlName="rol">
              <mat-option value="ADMIN">ADMIN</mat-option>
              <mat-option value="GERENTE">GERENTE</mat-option>
              <mat-option value="ALMACENISTA">ALMACENISTA</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="usuarioForm.invalid || saving">
            <mat-icon>person_add</mat-icon>
            Crear
          </button>
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
              <ng-container matColumnDef="rol"><th mat-header-cell *matHeaderCellDef>Rol</th><td mat-cell *matCellDef="let u">{{ u.rol }}</td></ng-container>
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
          <div class="empty-state">
            <mat-icon>group</mat-icon>
            <h3>No hay usuarios registrados</h3>
            <p>Crea una cuenta para que aparezca en la lista.</p>
          </div>
        }
      </div>
    </section>
  `
})
export class UsuariosComponent implements OnInit {
  loading = false;
  saving = false;
  usuarios: UsuarioResponse[] = [];
  usuariosPage?: Page<UsuarioResponse>;
  pageIndex = 0;
  pageSize = 20;
  usuarioCols = ['nombre', 'email', 'rol', 'activo', 'fechaCreacion'];
  usuarioForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rol: ['ALMACENISTA' as Rol, Validators.required],
    activo: [true]
  });

  constructor(private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadUsuarios();
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
  }

  totalUsuarios() {
    return this.usuariosPage?.totalElements ?? this.usuarios.length;
  }

  crearUsuario() {
    if (this.usuarioForm.invalid) return;
    this.saving = true;
    this.api.crearUsuario(this.usuarioForm.getRawValue()).subscribe({
      next: () => {
        this.snack.open('Usuario creado', 'Cerrar', { duration: 2500 });
        this.usuarioForm.reset({ nombre: '', email: '', password: '', rol: 'ALMACENISTA', activo: true });
        this.saving = false;
        this.loadUsuarios();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  toggleActivo(usuario: UsuarioResponse, activo: boolean) {
    this.api.toggleUsuario(usuario.id, activo).subscribe(updated => {
      this.usuarios = this.usuarios.map(current => current.id === updated.id ? updated : current);
      this.snack.open('Usuario actualizado', 'Cerrar', { duration: 2500 });
    });
  }
}
