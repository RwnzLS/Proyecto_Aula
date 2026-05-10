package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.DashboardKpi;
import com.proyecto.inventario.model.EstadoOrden;
import com.proyecto.inventario.repository.OrdenCompraRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.ProveedorRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
  private final ProductoRepository productos;
  private final ProveedorRepository proveedores;
  private final OrdenCompraRepository ordenes;

  public DashboardService(ProductoRepository productos, ProveedorRepository proveedores, OrdenCompraRepository ordenes) {
    this.productos = productos;
    this.proveedores = proveedores;
    this.ordenes = ordenes;
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
}
