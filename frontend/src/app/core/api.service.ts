import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DashboardKpi, EstadoOrden, MovimientoInventario, OrdenCompra, Page, PrecioProveedor, Producto, Proveedor, Usuario } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  dashboard() { return this.http.get<DashboardKpi>(`${this.api}/dashboard`); }
  productos(filters: Record<string, string | number | boolean | null | undefined> = {}) { return this.http.get<Page<Producto>>(`${this.api}/productos`, { params: this.params(filters) }); }
  crearProducto(body: Partial<Producto>) { return this.http.post<Producto>(`${this.api}/productos`, body); }
  actualizarProducto(id: number, body: Partial<Producto>) { return this.http.put<Producto>(`${this.api}/productos/${id}`, body); }
  ajustarStock(id: number, cantidad: number, motivo: string) { return this.http.patch<Producto>(`${this.api}/productos/${id}/ajustar-stock`, { cantidad, motivo }); }

  proveedores(filters: Record<string, string | number | null | undefined> = {}) { return this.http.get<Page<Proveedor>>(`${this.api}/proveedores`, { params: this.params(filters) }); }
  guardarProveedor(body: Partial<Proveedor>, id?: number) { return id ? this.http.put<Proveedor>(`${this.api}/proveedores/${id}`, body) : this.http.post<Proveedor>(`${this.api}/proveedores`, body); }

  historialPrecios(filters: Record<string, number | undefined> = {}) { return this.http.get<PrecioProveedor[]>(`${this.api}/precios/historial`, { params: this.params(filters) }); }
  registrarPrecio(body: { proveedorId: number; productoId: number; precioUnitario: number; moneda: string }) { return this.http.post<PrecioProveedor>(`${this.api}/precios`, body); }

  ordenes(filters: { estado?: EstadoOrden; proveedorId?: number; page?: number; size?: number } = {}) { return this.http.get<Page<OrdenCompra>>(`${this.api}/ordenes`, { params: this.params(filters) }); }
  crearOrden(body: unknown) { return this.http.post<OrdenCompra>(`${this.api}/ordenes`, body); }
  enviarOrden(id: number) { return this.http.put<OrdenCompra>(`${this.api}/ordenes/${id}/enviar`, {}); }
  recibirOrden(id: number, items: { detalleId: number; cantidadRecibida: number }[]) { return this.http.post<OrdenCompra>(`${this.api}/ordenes/${id}/recepcion`, { items }); }

  movimientos() { return this.http.get<Page<MovimientoInventario>>(`${this.api}/movimientos`); }
  usuarios() { return this.http.get<Page<Usuario>>(`${this.api}/usuarios`); }
  crearUsuario(body: { nombre: string; email: string; password: string; rol: string; activo: boolean }) { return this.http.post<Usuario>(`${this.api}/usuarios`, body); }

  private params(values: Record<string, string | number | boolean | null | undefined>) {
    let params = new HttpParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return params;
  }
}
