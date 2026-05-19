package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.PrecioRequest;
import com.proyecto.inventario.entity.PrecioProveedor;
import com.proyecto.inventario.entity.Producto;
import com.proyecto.inventario.entity.Proveedor;
import com.proyecto.inventario.exception.BusinessException;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.repository.PrecioProveedorRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.ProveedorRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

  @Transactional(readOnly = true)
  public List<PrecioProveedor> historial(Long productoId, Long proveedorId) {
    Specification<PrecioProveedor> spec = (root, query, cb) -> cb.and(
      cb.isTrue(root.get("producto").get("activo")),
      cb.isTrue(root.get("proveedor").get("activo"))
    );
    if (productoId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("producto").get("id"), productoId));
    if (proveedorId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("proveedor").get("id"), proveedorId));
    return precios.findAll(spec, Sort.by(Sort.Direction.DESC, "fechaRegistro"));
  }

  @Transactional(readOnly = true)
  public PrecioProveedor ultimo(Long productoId, Long proveedorId) {
    return precios.findUltimosActivos(productoId, proveedorId, PageRequest.of(0, 1)).stream()
      .findFirst()
      .orElseThrow(() -> new NotFoundException("Precio no encontrado para el producto y proveedor"));
  }

  @Transactional
  public PrecioProveedor create(PrecioRequest request) {
    PrecioProveedor precio = new PrecioProveedor();
    Producto producto = productos.findById(request.productoId()).orElseThrow(() -> new NotFoundException("Producto no encontrado"));
    Proveedor proveedor = proveedores.findById(request.proveedorId()).orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));
    validarActivos(producto, proveedor);
    precio.setProducto(producto);
    precio.setProveedor(proveedor);
    precio.setPrecioUnitario(request.precioUnitario());
    precio.setMoneda(Optional.ofNullable(request.moneda()).orElse("COP"));
    return precios.save(precio);
  }

  private void validarActivos(Producto producto, Proveedor proveedor) {
    if (!producto.isActivo()) throw new BusinessException("El producto esta inactivo");
    if (!proveedor.isActivo()) throw new BusinessException("El proveedor esta inactivo");
  }
}
