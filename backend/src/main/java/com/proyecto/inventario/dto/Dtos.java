package com.proyecto.inventario.dto;

import com.proyecto.inventario.model.Rol;
import com.proyecto.inventario.model.TipoMovimiento;
import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.entity.Producto;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class Dtos {
  private Dtos() {}

  public record LoginRequest(@Email String email, @NotBlank String password) {}
  public record LoginResponse(String token, String nombre, String email, Rol rol) {}
  public record SessionResponse(String nombre, String email, Rol rol) {}
  public record UserRequest(@NotBlank String nombre, @Email String email, @NotBlank String password, @NotNull Rol rol, Boolean activo) {}
  public record UsuarioResponse(Long id, String nombre, String email, Rol rol, boolean activo, Instant fechaCreacion) {}
  public record ProductoRequest(@NotBlank String nombre, String descripcion, @NotBlank String codigo, String categoria, @Min(0) Integer cantidadStock, @Min(0) Integer stockMinimo, String unidadMedida, Boolean activo) {}
  public record ProveedorRequest(@NotBlank String nombre, @NotBlank String rucNit, @Email String email, String telefono, String direccion, Boolean activo) {}
  public record AjusteStockRequest(@NotNull Integer cantidad, @NotBlank String motivo) {}
  public record MovimientoStockRequest(@NotNull Long productoId, @Min(1) Integer cantidad, @NotBlank String referencia) {}
  public record PrecioRequest(@NotNull Long proveedorId, @NotNull Long productoId, @DecimalMin("0.0") BigDecimal precioUnitario, String moneda) {}
  public record DetalleOrdenRequest(@NotNull Long productoId, @Min(1) Integer cantidadSolicitada, @DecimalMin("0.0") BigDecimal precioUnitario) {}
  public record OrdenRequest(@NotNull Long proveedorId, LocalDate fechaEsperada, String observaciones, @NotEmpty List<DetalleOrdenRequest> detalles) {}
  public record RecepcionItemRequest(@NotNull Long detalleId, @Min(1) Integer cantidadRecibida) {}
  public record RecepcionRequest(@NotEmpty List<RecepcionItemRequest> items) {}
  public record ApiError(String code, String message, Instant timestamp) {}
  public record DashboardKpi(long totalProductos, long stockBajo, long ordenesPendientes, long proveedoresActivos) {}
  public record MovimientoTipoResumen(TipoMovimiento tipoMovimiento, long cantidad) {}
  public record ProductoVentaResumen(Long productoId, String producto, long cantidad) {}
  public record DashboardResumen(
    DashboardKpi kpis,
    long stockTotal,
    long ventasTotal,
    List<MovimientoTipoResumen> movimientosPorTipo,
    List<ProductoVentaResumen> topVentas,
    List<Producto> productosCriticos,
    List<MovimientoInventario> actividadReciente
  ) {}
}
