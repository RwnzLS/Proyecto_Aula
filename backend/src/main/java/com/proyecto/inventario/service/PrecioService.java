package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.PrecioRequest;
import com.proyecto.inventario.entity.PrecioProveedor;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.repository.PrecioProveedorRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.ProveedorRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class PrecioService {
  private final PrecioProveedorRepository precios;
  private final ProductoRepository productos;
  private final ProveedorRepository proveedores;

  public PrecioService(PrecioProveedorRepository precios, ProductoRepository productos, ProveedorRepository proveedores) {
    this.precios = precios;
    this.productos = productos;
    this.proveedores = proveedores;
  }

  public List<PrecioProveedor> historial(Long productoId, Long proveedorId) {
    Specification<PrecioProveedor> spec = (root, query, cb) -> {
      query.orderBy(cb.desc(root.get("fechaRegistro")));
      return cb.conjunction();
    };
    if (productoId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("producto").get("id"), productoId));
    if (proveedorId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("proveedor").get("id"), proveedorId));
    return precios.findAll(spec);
  }

  public PrecioProveedor create(PrecioRequest request) {
    PrecioProveedor precio = new PrecioProveedor();
    precio.setProducto(productos.findById(request.productoId()).orElseThrow(() -> new NotFoundException("Producto no encontrado")));
    precio.setProveedor(proveedores.findById(request.proveedorId()).orElseThrow(() -> new NotFoundException("Proveedor no encontrado")));
    precio.setPrecioUnitario(request.precioUnitario());
    precio.setMoneda(Optional.ofNullable(request.moneda()).orElse("COP"));
    return precios.save(precio);
  }
}
