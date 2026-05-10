import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Chart } from 'chart.js/auto';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardKpi, EstadoOrden, MovimientoInventario, OrdenCompra, PrecioProveedor, Producto, Proveedor, Rol, Usuario } from '../../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, CurrencyPipe, DatePipe,
    MatButtonModule, MatCardModule, MatDialogModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatSelectModule, MatTableModule, MatTabsModule, MatToolbarModule
  ],
  template: `
    <mat-toolbar color="primary">
      <span>Inventario</span>
      <span class="toolbar-spacer"></span>
      <span>{{ auth.session()?.nombre }} - {{ auth.session()?.rol }}</span>
      <button mat-icon-button title="Salir" (click)="auth.logout()"><mat-icon>logout</mat-icon></button>
    </mat-toolbar>

    <main class="page">
      <mat-tab-group>
        <mat-tab label="Dashboard">
          <section class="section grid kpi-grid">
            <mat-card *ngFor="let item of kpiCards">
              <mat-card-header><mat-card-title>{{ item.label }}</mat-card-title></mat-card-header>
              <mat-card-content><h1>{{ item.value }}</h1></mat-card-content>
            </mat-card>
          </section>
        </mat-tab>

        <mat-tab label="Productos">
          <section class="section grid">
            <form [formGroup]="productoFiltro" class="grid form-grid">
              <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Categoria</mat-label><input matInput formControlName="categoria"></mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Stock bajo</mat-label>
                <mat-select formControlName="stockBajo"><mat-option [value]="undefined">Todos</mat-option><mat-option [value]="true">Si</mat-option></mat-select>
              </mat-form-field>
            </form>
            <form *ngIf="can(['ADMIN'])" [formGroup]="productoForm" (ngSubmit)="guardarProducto()" class="grid form-grid">
              <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Codigo</mat-label><input matInput formControlName="codigo"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Categoria</mat-label><input matInput formControlName="categoria"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Stock</mat-label><input matInput type="number" formControlName="cantidadStock"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Minimo</mat-label><input matInput type="number" formControlName="stockMinimo"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Unidad</mat-label><input matInput formControlName="unidadMedida"></mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="productoForm.invalid"><mat-icon>save</mat-icon>Guardar</button>
            </form>
            <div class="table-wrap">
              <table mat-table [dataSource]="productos">
                <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Codigo</th><td mat-cell *matCellDef="let p">{{ p.codigo }}</td></ng-container>
                <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th><td mat-cell *matCellDef="let p">{{ p.nombre }}</td></ng-container>
                <ng-container matColumnDef="categoria"><th mat-header-cell *matHeaderCellDef>Categoria</th><td mat-cell *matCellDef="let p">{{ p.categoria }}</td></ng-container>
                <ng-container matColumnDef="stock"><th mat-header-cell *matHeaderCellDef>Stock</th><td mat-cell *matCellDef="let p" [class.stock-low]="p.cantidadStock <= p.stockMinimo">{{ p.cantidadStock }} / {{ p.stockMinimo }}</td></ng-container>
                <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef>Acciones</th><td mat-cell *matCellDef="let p" class="actions"><button mat-icon-button title="Editar" *ngIf="can(['ADMIN'])" (click)="editarProducto(p)"><mat-icon>edit</mat-icon></button><button mat-icon-button title="Ajustar" *ngIf="can(['ADMIN','ALMACENISTA'])" (click)="ajustar(p)"><mat-icon>inventory</mat-icon></button></td></ng-container>
                <tr mat-header-row *matHeaderRowDef="productoCols"></tr><tr mat-row *matRowDef="let row; columns: productoCols;"></tr>
              </table>
            </div>
          </section>
        </mat-tab>

        <mat-tab label="Proveedores">
          <section class="section grid">
            <form [formGroup]="proveedorForm" (ngSubmit)="guardarProveedor()" class="grid form-grid" *ngIf="can(['ADMIN'])">
              <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>RUC/NIT</mat-label><input matInput formControlName="rucNit"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Telefono</mat-label><input matInput formControlName="telefono"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Direccion</mat-label><input matInput formControlName="direccion"></mat-form-field>
              <button mat-raised-button color="primary" type="submit"><mat-icon>save</mat-icon>Guardar</button>
            </form>
            <div class="table-wrap"><table mat-table [dataSource]="proveedores">
              <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th><td mat-cell *matCellDef="let p">{{ p.nombre }}</td></ng-container>
              <ng-container matColumnDef="rucNit"><th mat-header-cell *matHeaderCellDef>RUC/NIT</th><td mat-cell *matCellDef="let p">{{ p.rucNit }}</td></ng-container>
              <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let p">{{ p.email }}</td></ng-container>
              <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef>Acciones</th><td mat-cell *matCellDef="let p"><button mat-icon-button *ngIf="can(['ADMIN'])" (click)="editarProveedor(p)"><mat-icon>edit</mat-icon></button></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="proveedorCols"></tr><tr mat-row *matRowDef="let row; columns: proveedorCols;"></tr>
            </table></div>
          </section>
        </mat-tab>

        <mat-tab label="Precios">
          <section class="section grid">
            <form [formGroup]="precioForm" (ngSubmit)="registrarPrecio()" class="grid form-grid">
              <mat-form-field appearance="outline"><mat-label>Producto</mat-label><mat-select formControlName="productoId"><mat-option *ngFor="let p of productos" [value]="p.id">{{ p.nombre }}</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Proveedor</mat-label><mat-select formControlName="proveedorId"><mat-option *ngFor="let p of proveedores" [value]="p.id">{{ p.nombre }}</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Precio</mat-label><input matInput type="number" formControlName="precioUnitario"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Moneda</mat-label><input matInput formControlName="moneda"></mat-form-field>
              <button mat-raised-button color="primary" type="submit"><mat-icon>add_chart</mat-icon>Registrar</button>
            </form>
            <canvas #priceChart></canvas>
            <div class="table-wrap"><table mat-table [dataSource]="precios">
              <ng-container matColumnDef="fecha"><th mat-header-cell *matHeaderCellDef>Fecha</th><td mat-cell *matCellDef="let p">{{ p.fechaRegistro | date:'short' }}</td></ng-container>
              <ng-container matColumnDef="producto"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let p">{{ p.producto.nombre }}</td></ng-container>
              <ng-container matColumnDef="proveedor"><th mat-header-cell *matHeaderCellDef>Proveedor</th><td mat-cell *matCellDef="let p">{{ p.proveedor.nombre }}</td></ng-container>
              <ng-container matColumnDef="precio"><th mat-header-cell *matHeaderCellDef>Precio</th><td mat-cell *matCellDef="let p">{{ p.precioUnitario | currency:p.moneda }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="precioCols"></tr><tr mat-row *matRowDef="let row; columns: precioCols;"></tr>
            </table></div>
          </section>
        </mat-tab>

        <mat-tab label="Ordenes">
          <section class="section grid">
            <form [formGroup]="ordenForm" (ngSubmit)="crearOrden()" class="grid" *ngIf="can(['ADMIN','GERENTE'])">
              <div class="grid form-grid">
                <mat-form-field appearance="outline"><mat-label>Proveedor</mat-label><mat-select formControlName="proveedorId"><mat-option *ngFor="let p of proveedores" [value]="p.id">{{ p.nombre }}</mat-option></mat-select></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Fecha esperada</mat-label><input matInput type="date" formControlName="fechaEsperada"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Observaciones</mat-label><input matInput formControlName="observaciones"></mat-form-field>
              </div>
              <div formArrayName="detalles" class="grid">
                <div *ngFor="let row of detalles.controls; let i = index" [formGroupName]="i" class="grid form-grid">
                  <mat-form-field appearance="outline"><mat-label>Producto</mat-label><mat-select formControlName="productoId"><mat-option *ngFor="let p of productos" [value]="p.id">{{ p.nombre }}</mat-option></mat-select></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Cantidad</mat-label><input matInput type="number" formControlName="cantidadSolicitada"></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Precio</mat-label><input matInput type="number" formControlName="precioUnitario"></mat-form-field>
                  <button mat-icon-button type="button" title="Eliminar" (click)="detalles.removeAt(i)"><mat-icon>delete</mat-icon></button>
                </div>
              </div>
              <div class="actions"><button mat-stroked-button type="button" (click)="addDetalle()"><mat-icon>add</mat-icon>Fila</button><strong>Total: {{ totalOrden() | currency:'COP' }}</strong><button mat-raised-button color="primary" type="submit"><mat-icon>send</mat-icon>Crear</button></div>
            </form>
            <div class="table-wrap"><table mat-table [dataSource]="ordenes">
              <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>#</th><td mat-cell *matCellDef="let o">{{ o.id }}</td></ng-container>
              <ng-container matColumnDef="proveedor"><th mat-header-cell *matHeaderCellDef>Proveedor</th><td mat-cell *matCellDef="let o">{{ o.proveedor.nombre }}</td></ng-container>
              <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let o">{{ o.estado }}</td></ng-container>
              <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let o">{{ o.total | currency:'COP' }}</td></ng-container>
              <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef>Acciones</th><td mat-cell *matCellDef="let o" class="actions"><button mat-icon-button *ngIf="can(['ADMIN','GERENTE']) && o.estado === 'BORRADOR'" (click)="enviar(o)"><mat-icon>outgoing_mail</mat-icon></button><button mat-icon-button *ngIf="can(['ADMIN','ALMACENISTA'])" (click)="ordenSeleccionada = o"><mat-icon>fact_check</mat-icon></button></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="ordenCols"></tr><tr mat-row *matRowDef="let row; columns: ordenCols;"></tr>
            </table></div>
          </section>
        </mat-tab>

        <mat-tab label="Recepcion">
          <section class="section grid">
            <h2>Orden {{ ordenSeleccionada?.id || 'sin seleccionar' }}</h2>
            <div class="table-wrap" *ngIf="ordenSeleccionada"><table mat-table [dataSource]="ordenSeleccionada.detalles">
              <ng-container matColumnDef="producto"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let d">{{ d.producto.nombre }}</td></ng-container>
              <ng-container matColumnDef="solicitada"><th mat-header-cell *matHeaderCellDef>Solicitada</th><td mat-cell *matCellDef="let d">{{ d.cantidadSolicitada }}</td></ng-container>
              <ng-container matColumnDef="recibida"><th mat-header-cell *matHeaderCellDef>Recibida</th><td mat-cell *matCellDef="let d">{{ d.cantidadRecibida }}</td></ng-container>
              <ng-container matColumnDef="nueva"><th mat-header-cell *matHeaderCellDef>Nueva</th><td mat-cell *matCellDef="let d"><input matInput type="number" min="0" [value]="recepcion[d.id] || 0" (input)="setRecepcion(d.id, $event)"></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="recepcionCols"></tr><tr mat-row *matRowDef="let row; columns: recepcionCols;"></tr>
            </table></div>
            <button mat-raised-button color="primary" *ngIf="ordenSeleccionada" (click)="confirmarRecepcion()"><mat-icon>check_circle</mat-icon>Confirmar recepcion</button>
          </section>
        </mat-tab>

        <mat-tab label="Movimientos">
          <section class="section table-wrap"><table mat-table [dataSource]="movimientos">
            <ng-container matColumnDef="fecha"><th mat-header-cell *matHeaderCellDef>Fecha</th><td mat-cell *matCellDef="let m">{{ m.fecha | date:'short' }}</td></ng-container>
            <ng-container matColumnDef="producto"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let m">{{ m.producto.nombre }}</td></ng-container>
            <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let m">{{ m.tipoMovimiento }}</td></ng-container>
            <ng-container matColumnDef="cantidad"><th mat-header-cell *matHeaderCellDef>Cantidad</th><td mat-cell *matCellDef="let m">{{ m.cantidad }}</td></ng-container>
            <ng-container matColumnDef="referencia"><th mat-header-cell *matHeaderCellDef>Referencia</th><td mat-cell *matCellDef="let m">{{ m.referencia }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="movCols"></tr><tr mat-row *matRowDef="let row; columns: movCols;"></tr>
          </table></section>
        </mat-tab>

        <mat-tab label="Usuarios" *ngIf="can(['ADMIN'])">
          <section class="section grid">
            <form [formGroup]="usuarioForm" (ngSubmit)="crearUsuario()" class="grid form-grid">
              <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Password temporal</mat-label><input matInput type="password" formControlName="password"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Rol</mat-label><mat-select formControlName="rol"><mat-option value="ADMIN">ADMIN</mat-option><mat-option value="GERENTE">GERENTE</mat-option><mat-option value="ALMACENISTA">ALMACENISTA</mat-option></mat-select></mat-form-field>
              <button mat-raised-button color="primary" type="submit"><mat-icon>person_add</mat-icon>Crear</button>
            </form>
            <div class="table-wrap"><table mat-table [dataSource]="usuarios">
              <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th><td mat-cell *matCellDef="let u">{{ u.nombre }}</td></ng-container>
              <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let u">{{ u.email }}</td></ng-container>
              <ng-container matColumnDef="rol"><th mat-header-cell *matHeaderCellDef>Rol</th><td mat-cell *matCellDef="let u">{{ u.rol }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="usuarioCols"></tr><tr mat-row *matRowDef="let row; columns: usuarioCols;"></tr>
            </table></div>
          </section>
        </mat-tab>
      </mat-tab-group>
    </main>
  `
})
export class ShellComponent implements OnInit, AfterViewInit {
  @ViewChild('priceChart') chartCanvas?: ElementRef<HTMLCanvasElement>;
  chart?: Chart;
  kpis?: DashboardKpi;
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  precios: PrecioProveedor[] = [];
  ordenes: OrdenCompra[] = [];
  movimientos: MovimientoInventario[] = [];
  usuarios: Usuario[] = [];
  ordenSeleccionada?: OrdenCompra;
  recepcion: Record<number, number> = {};
  editingProducto?: number;
  editingProveedor?: number;

  productoCols = ['codigo', 'nombre', 'categoria', 'stock', 'acciones'];
  proveedorCols = ['nombre', 'rucNit', 'email', 'acciones'];
  precioCols = ['fecha', 'producto', 'proveedor', 'precio'];
  ordenCols = ['id', 'proveedor', 'estado', 'total', 'acciones'];
  recepcionCols = ['producto', 'solicitada', 'recibida', 'nueva'];
  movCols = ['fecha', 'producto', 'tipo', 'cantidad', 'referencia'];
  usuarioCols = ['nombre', 'email', 'rol'];

  productoFiltro = this.fb.group({ nombre: [''], categoria: [''], stockBajo: [undefined as boolean | undefined] });
  productoForm = this.fb.nonNullable.group({ nombre: ['', Validators.required], descripcion: [''], codigo: ['', Validators.required], categoria: [''], cantidadStock: [0], stockMinimo: [0], unidadMedida: ['unidad'], activo: [true] });
  proveedorForm = this.fb.nonNullable.group({ nombre: ['', Validators.required], rucNit: [''], email: ['', Validators.email], telefono: [''], direccion: [''], activo: [true] });
  precioForm = this.fb.nonNullable.group({ productoId: [0, Validators.required], proveedorId: [0, Validators.required], precioUnitario: [0, Validators.required], moneda: ['COP'] });
  ordenForm = this.fb.nonNullable.group({ proveedorId: [0, Validators.required], fechaEsperada: [''], observaciones: [''], detalles: this.fb.array([]) });
  usuarioForm = this.fb.nonNullable.group({ nombre: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', Validators.required], rol: ['ALMACENISTA' as Rol], activo: [true] });

  constructor(public auth: AuthService, private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar, private dialog: MatDialog) {}

  get detalles(): FormArray { return this.ordenForm.controls.detalles; }
  get kpiCards() {
    const k = this.kpis ?? { totalProductos: 0, stockBajo: 0, ordenesPendientes: 0, proveedoresActivos: 0 };
    return [
      { label: 'Productos', value: k.totalProductos },
      { label: 'Stock bajo', value: k.stockBajo },
      { label: 'Ordenes pendientes', value: k.ordenesPendientes },
      { label: 'Proveedores activos', value: k.proveedoresActivos }
    ];
  }

  ngOnInit() {
    this.addDetalle();
    this.loadAll();
    this.productoFiltro.valueChanges.pipe(debounceTime(350)).subscribe(() => this.loadProductos());
  }

  ngAfterViewInit() { this.renderChart(); }
  can(roles: Rol[]) { return this.auth.hasRole(roles); }

  loadAll() {
    this.api.dashboard().subscribe(k => this.kpis = k);
    this.loadProductos();
    this.api.proveedores({ size: 100 }).subscribe(p => this.proveedores = p.content);
    this.api.historialPrecios().subscribe(p => { this.precios = p; this.renderChart(); });
    this.api.ordenes({ size: 100 }).subscribe(o => this.ordenes = o.content);
    this.api.movimientos().subscribe(m => this.movimientos = m.content);
    if (this.can(['ADMIN'])) this.api.usuarios().subscribe(u => this.usuarios = u.content);
  }

  loadProductos() {
    this.api.productos({ ...this.productoFiltro.value, size: 100 }).subscribe(p => this.productos = p.content);
  }

  guardarProducto() {
    const request = this.productoForm.getRawValue();
    const call = this.editingProducto ? this.api.actualizarProducto(this.editingProducto, request) : this.api.crearProducto(request);
    call.subscribe(() => { this.ok('Producto guardado'); this.productoForm.reset({ cantidadStock: 0, stockMinimo: 0, unidadMedida: 'unidad', activo: true }); this.editingProducto = undefined; this.loadProductos(); });
  }

  editarProducto(p: Producto) { this.editingProducto = p.id; this.productoForm.patchValue(p); }
  ajustar(p: Producto) {
    const cantidad = Number(prompt('Cantidad del ajuste (use negativo para descontar)', '1'));
    const motivo = prompt('Motivo del ajuste', 'Ajuste manual') ?? 'Ajuste manual';
    if (!Number.isFinite(cantidad)) return;
    this.api.ajustarStock(p.id, cantidad, motivo).subscribe(() => { this.ok('Stock ajustado'); this.loadProductos(); });
  }

  guardarProveedor() {
    this.api.guardarProveedor(this.proveedorForm.getRawValue(), this.editingProveedor).subscribe(() => {
      this.ok('Proveedor guardado'); this.proveedorForm.reset({ activo: true }); this.editingProveedor = undefined; this.loadAll();
    });
  }

  editarProveedor(p: Proveedor) { this.editingProveedor = p.id; this.proveedorForm.patchValue(p); }
  registrarPrecio() { this.api.registrarPrecio(this.precioForm.getRawValue()).subscribe(() => { this.ok('Precio registrado'); this.loadAll(); }); }

  addDetalle() {
    this.detalles.push(this.fb.nonNullable.group({ productoId: [0, Validators.required], cantidadSolicitada: [1, Validators.required], precioUnitario: [0, Validators.required] }));
  }

  totalOrden() {
    return this.detalles.controls.reduce((sum, control) => sum + (Number(control.value.cantidadSolicitada) || 0) * (Number(control.value.precioUnitario) || 0), 0);
  }

  crearOrden() {
    this.api.crearOrden(this.ordenForm.getRawValue()).subscribe(() => { this.ok('Orden creada'); this.detalles.clear(); this.addDetalle(); this.ordenForm.reset(); this.loadAll(); });
  }

  enviar(o: OrdenCompra) {
    this.api.enviarOrden(o.id).subscribe(() => { this.ok('Orden enviada'); this.loadAll(); });
  }

  setRecepcion(id: number, event: Event) {
    this.recepcion[id] = Number((event.target as HTMLInputElement).value);
  }

  confirmarRecepcion() {
    if (!this.ordenSeleccionada || !confirm('Confirmar recepcion de mercancia?')) return;
    const items = this.ordenSeleccionada.detalles.map(d => ({ detalleId: d.id, cantidadRecibida: this.recepcion[d.id] || 0 })).filter(i => i.cantidadRecibida > 0);
    this.api.recibirOrden(this.ordenSeleccionada.id, items).subscribe(() => { this.ok('Recepcion registrada'); this.recepcion = {}; this.ordenSeleccionada = undefined; this.loadAll(); });
  }

  crearUsuario() {
    this.api.crearUsuario(this.usuarioForm.getRawValue()).subscribe(() => { this.ok('Usuario creado'); this.usuarioForm.reset({ rol: 'ALMACENISTA', activo: true }); this.loadAll(); });
  }

  renderChart() {
    if (!this.chartCanvas) return;
    this.chart?.destroy();
    const ordered = [...this.precios].reverse();
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ordered.map(p => new Date(p.fechaRegistro).toLocaleDateString()),
        datasets: [{ label: 'Precio', data: ordered.map(p => p.precioUnitario), borderColor: '#00796b', backgroundColor: '#f2b705', tension: 0.25 }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private ok(message: string) { this.snack.open(message, 'Cerrar', { duration: 2500 }); }
}
