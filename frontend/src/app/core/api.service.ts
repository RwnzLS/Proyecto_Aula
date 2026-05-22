import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DashboardKpi, DashboardResumen, EstadoOrden, MovimientoInventario, OrdenCompra, OrdenRequest, Page, PrecioProveedor, Producto, Proveedor, RecepcionItemRequest, TipoMovimiento, UsuarioResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  dashboard() { return this.http.get<DashboardKpi>(`${this.api}/dashboard`); }
  dashboardResumen() { return this.http.get<DashboardResumen>(`${this.api}/dashboard/resumen`); }
  productos(filters: { nombre?: string | null; categoria?: string | null; stockBajo?: boolean | null; activo?: boolean | null; page?: number; size?: number } = {}) {
    return this.http.get<Page<Producto>>(`${this.api}/productos`, { params: this.params(filters) });
  }
  crearProducto(body: Partial<Producto>) { return this.http.post<Producto>(`${this.api}/productos`, body); }
  actualizarProducto(id: number, body: Partial<Producto>) { return this.http.put<Producto>(`${this.api}/productos/${id}`, body); }
  eliminarProducto(id: number) { return this.http.delete<void>(`${this.api}/productos/${id}`); }
  reactivarProducto(id: number) { return this.http.patch<Producto>(`${this.api}/productos/${id}/reactivar`, {}); }
  ajustarStock(id: number, cantidad: number, motivo: string) { return this.http.patch<Producto>(`${this.api}/productos/${id}/ajustar-stock`, { cantidad, motivo }); }
  registrarEntrada(body: { productoId: number; cantidad: number; referencia: string }) { return this.http.post<MovimientoInventario>(`${this.api}/entradas`, body); }
  registrarSalida(body: { productoId: number; cantidad: number; referencia: string }) { return this.http.post<MovimientoInventario>(`${this.api}/salidas`, body); }

  proveedores(filters: { nombre?: string | null; page?: number; size?: number } = {}) {
    return this.http.get<Page<Proveedor>>(`${this.api}/proveedores`, { params: this.params(filters) });
  }
  guardarProveedor(body: Partial<Proveedor>, id?: number) { return id ? this.http.put<Proveedor>(`${this.api}/proveedores/${id}`, body) : this.http.post<Proveedor>(`${this.api}/proveedores`, body); }
  eliminarProveedor(id: number) { return this.http.delete<void>(`${this.api}/proveedores/${id}`); }

  historialPrecios(filters: { productoId?: number; proveedorId?: number } = {}) { return this.http.get<PrecioProveedor[]>(`${this.api}/precios/historial`, { params: this.params(filters) }); }
  ultimoPrecio(filters: { productoId: number; proveedorId: number }) { return this.http.get<PrecioProveedor>(`${this.api}/precios/ultimo`, { params: this.params(filters) }); }
  registrarPrecio(body: { proveedorId: number; productoId: number; precioUnitario: number; moneda: string }) { return this.http.post<PrecioProveedor>(`${this.api}/precios`, body); }

  ordenes(filters: { estado?: EstadoOrden; proveedorId?: number; page?: number; size?: number } = {}) { return this.http.get<Page<OrdenCompra>>(`${this.api}/ordenes`, { params: this.params(filters) }); }
  crearOrden(body: OrdenRequest) { return this.http.post<OrdenCompra>(`${this.api}/ordenes`, body); }
  enviarOrden(id: number) { return this.http.put<OrdenCompra>(`${this.api}/ordenes/${id}/enviar`, {}); }
  cancelarOrden(id: number) { return this.http.patch<OrdenCompra>(`${this.api}/ordenes/${id}/cancelar`, {}); }
  recibirOrden(id: number, items: RecepcionItemRequest[]) { return this.http.post<OrdenCompra>(`${this.api}/ordenes/${id}/recepcion`, { items }); }

  movimientos(filters: { productoId?: number | null; tipoMovimiento?: TipoMovimiento | null; fechaDesde?: string | null; fechaHasta?: string | null; page?: number; size?: number } = {}) {
    return this.http.get<Page<MovimientoInventario>>(`${this.api}/movimientos`, { params: this.params(filters) });
  }

  usuarios(filters: { page?: number; size?: number } = {}) {
    return this.http.get<Page<UsuarioResponse>>(`${this.api}/usuarios`, { params: this.params(filters) });
  }

  crearUsuario(body: { nombre: string; email: string; password: string; rol: string; activo: boolean }) {
    return this.http.post<UsuarioResponse>(`${this.api}/usuarios`, body);
  }

  toggleUsuario(id: number, activo: boolean) {
    return this.http.patch<UsuarioResponse>(`${this.api}/usuarios/${id}/activo`, null, { params: { activo: String(activo) } });
  }

  private params(values: object) {
    let params = new HttpParams();
    Object.entries(values as Record<string, string | number | boolean | null | undefined>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return params;
  }
}
