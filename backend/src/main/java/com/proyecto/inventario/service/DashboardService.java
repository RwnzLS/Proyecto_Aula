package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.DashboardKpi;
import com.proyecto.inventario.dto.Dtos.DashboardResumen;
import com.proyecto.inventario.dto.Dtos.MovimientoTipoResumen;
import com.proyecto.inventario.dto.Dtos.ProductoVentaResumen;
import com.proyecto.inventario.model.EstadoOrden;
import com.proyecto.inventario.model.TipoMovimiento;
import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import com.proyecto.inventario.repository.OrdenCompraRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.ProveedorRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
  private final ProductoRepository productos;
  private final ProveedorRepository proveedores;
  private final OrdenCompraRepository ordenes;
  private final MovimientoInventarioRepository movimientos;

  public DashboardService(ProductoRepository productos, ProveedorRepository proveedores, OrdenCompraRepository ordenes,
                          MovimientoInventarioRepository movimientos) {
    this.productos = productos;
    this.proveedores = proveedores;
    this.ordenes = ordenes;
    this.movimientos = movimientos;
  }

  @Transactional(readOnly = true)
  public DashboardKpi kpis() {
    long stockBajo = productos.countStockBajo();
    return new DashboardKpi(
      productos.countByActivoTrue(),
      stockBajo,
      ordenes.countByEstadoIn(List.of(EstadoOrden.BORRADOR, EstadoOrden.ENVIADA, EstadoOrden.RECIBIDA_PARCIAL)),
      proveedores.countByActivoTrue()
    );
  }

  @Transactional(readOnly = true)
  public DashboardResumen resumen() {
    return new DashboardResumen(
      kpis(),
      productos.sumStockActivo(),
      movimientos.sumCantidadByTipo(TipoMovimiento.SALIDA),
      movimientos.sumCantidadAgrupadaPorTipo().stream()
        .map(row -> new MovimientoTipoResumen((TipoMovimiento) row[0], ((Number) row[1]).longValue()))
        .toList(),
      movimientos.topProductosPorTipo(TipoMovimiento.SALIDA, PageRequest.of(0, 5)).stream()
        .map(row -> new ProductoVentaResumen(((Number) row[0]).longValue(), (String) row[1], ((Number) row[2]).longValue()))
        .toList(),
      productos.findStockBajoActivos(PageRequest.of(0, 5)),
      movimientos.findTop6ByOrderByFechaDesc()
    );
  }
}
