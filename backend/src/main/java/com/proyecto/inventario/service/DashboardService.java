package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.DashboardKpi;
import com.proyecto.inventario.entity.Producto;
import com.proyecto.inventario.model.EstadoOrden;
import com.proyecto.inventario.repository.OrdenCompraRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.ProveedorRepository;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

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

  public DashboardKpi kpis() {
    long stockBajo = productos.findAll((Specification<Producto>) (root, query, cb) ->
      cb.lessThanOrEqualTo(root.get("cantidadStock"), root.get("stockMinimo"))).size();
    return new DashboardKpi(
      productos.countByActivoTrue(),
      stockBajo,
      ordenes.countByEstadoIn(List.of(EstadoOrden.BORRADOR, EstadoOrden.ENVIADA, EstadoOrden.RECIBIDA_PARCIAL)),
      proveedores.countByActivoTrue()
    );
  }
}
