export type Rol = 'ADMIN' | 'GERENTE' | 'ALMACENISTA';
export type EstadoOrden = 'BORRADOR' | 'ENVIADA' | 'RECIBIDA_PARCIAL' | 'RECIBIDA' | 'CANCELADA';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UsuarioResponse { id: number; nombre: string; email: string; rol: Rol; activo: boolean; fechaCreacion: string; }
export interface Producto { id: number; nombre: string; descripcion: string; codigo: string; categoria: string; cantidadStock: number; stockMinimo: number; unidadMedida: string; activo: boolean; }
export interface Proveedor { id: number; nombre: string; rucNit: string; email: string; telefono: string; direccion: string; activo: boolean; }
export interface PrecioProveedor { id: number; proveedor: Proveedor; producto: Producto; precioUnitario: number; moneda: string; fechaRegistro: string; }
export interface DetalleOrden { id: number; producto: Producto; cantidadSolicitada: number; cantidadRecibida: number; precioUnitario: number; }
export interface OrdenCompra { id: number; proveedor: Proveedor; usuario: UsuarioResponse; fechaCreacion: string; fechaEsperada: string; estado: EstadoOrden; observaciones: string; total: number; detalles: DetalleOrden[]; }
export interface DetalleOrdenRequest { productoId: number; cantidadSolicitada: number; precioUnitario: number; }
export interface OrdenRequest { proveedorId: number; fechaEsperada: string; observaciones: string; detalles: DetalleOrdenRequest[]; }
export interface RecepcionItemRequest { detalleId: number; cantidadRecibida: number; }
export interface MovimientoInventario { id: number; producto: Producto; tipoMovimiento: TipoMovimiento; cantidad: number; usuarioResponsable: UsuarioResponse; referencia: string; fecha: string; }
export interface DashboardKpi { totalProductos: number; stockBajo: number; ordenesPendientes: number; proveedoresActivos: number; }
export interface MovimientoTipoResumen { tipoMovimiento: TipoMovimiento; cantidad: number; }
export interface ProductoVentaResumen { productoId: number; producto: string; cantidad: number; }
export interface DashboardResumen {
  kpis: DashboardKpi;
  stockTotal: number;
  ventasTotal: number;
  movimientosPorTipo: MovimientoTipoResumen[];
  topVentas: ProductoVentaResumen[];
  productosCriticos: Producto[];
  actividadReciente: MovimientoInventario[];
}
