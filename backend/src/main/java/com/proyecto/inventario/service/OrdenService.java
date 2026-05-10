package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.DetalleOrdenRequest;
import com.proyecto.inventario.dto.Dtos.OrdenRequest;
import com.proyecto.inventario.dto.Dtos.RecepcionItemRequest;
import com.proyecto.inventario.dto.Dtos.RecepcionRequest;
import com.proyecto.inventario.entity.DetalleOrden;
import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.entity.OrdenCompra;
import com.proyecto.inventario.entity.Producto;
import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.exception.BusinessException;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.model.EstadoOrden;
import com.proyecto.inventario.model.TipoMovimiento;
import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import com.proyecto.inventario.repository.OrdenCompraRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.ProveedorRepository;
import com.proyecto.inventario.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrdenService {
  private final OrdenCompraRepository ordenes;
  private final ProductoRepository productos;
  private final ProveedorRepository proveedores;
  private final UsuarioRepository usuarios;
  private final MovimientoInventarioRepository movimientos;
  private final EmailService email;

  public OrdenService(OrdenCompraRepository ordenes, ProductoRepository productos, ProveedorRepository proveedores,
                      UsuarioRepository usuarios, MovimientoInventarioRepository movimientos, EmailService email) {
    this.ordenes = ordenes;
    this.productos = productos;
    this.proveedores = proveedores;
    this.usuarios = usuarios;
    this.movimientos = movimientos;
    this.email = email;
  }

  public Page<OrdenCompra> list(EstadoOrden estado, Long proveedorId, Pageable pageable) {
    Specification<OrdenCompra> spec = (root, query, cb) -> cb.conjunction();
    if (estado != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("estado"), estado));
    if (proveedorId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("proveedor").get("id"), proveedorId));
    return ordenes.findAll(spec, pageable);
  }

  @Transactional
  public OrdenCompra create(OrdenRequest request, Authentication auth) {
    OrdenCompra orden = new OrdenCompra();
    orden.setProveedor(proveedores.findById(request.proveedorId()).orElseThrow(() -> new NotFoundException("Proveedor no encontrado")));
    orden.setUsuario(usuarios.findByEmail(auth.getName()).orElseThrow());
    orden.setFechaEsperada(request.fechaEsperada());
    orden.setObservaciones(request.observaciones());
    BigDecimal total = BigDecimal.ZERO;
    for (DetalleOrdenRequest item : request.detalles()) {
      DetalleOrden detalle = new DetalleOrden();
      detalle.setOrden(orden);
      detalle.setProducto(productos.findById(item.productoId()).orElseThrow(() -> new NotFoundException("Producto no encontrado")));
      detalle.setCantidadSolicitada(item.cantidadSolicitada());
      detalle.setPrecioUnitario(item.precioUnitario());
      total = total.add(item.precioUnitario().multiply(BigDecimal.valueOf(item.cantidadSolicitada())));
      orden.getDetalles().add(detalle);
    }
    orden.setTotal(total);
    return ordenes.save(orden);
  }

  @Transactional
  public OrdenCompra enviar(Long id) {
    OrdenCompra orden = get(id);
    if (orden.getEstado() != EstadoOrden.BORRADOR) throw new BusinessException("Solo se pueden enviar ordenes en borrador");
    orden.setEstado(EstadoOrden.ENVIADA);
    OrdenCompra saved = ordenes.save(orden);
    email.sendTemplate(saved.getProveedor().getEmail(), "Orden de compra #" + saved.getId(), "orden-enviada",
      Map.of("ordenId", saved.getId(), "total", saved.getTotal()));
    return saved;
  }

  @Transactional
  public OrdenCompra recepcion(Long id, RecepcionRequest request, Authentication auth) {
    OrdenCompra orden = get(id);
    Usuario user = usuarios.findByEmail(auth.getName()).orElseThrow();
    Map<Long, DetalleOrden> byId = orden.getDetalles().stream().collect(Collectors.toMap(DetalleOrden::getId, d -> d));
    for (RecepcionItemRequest item : request.items()) {
      DetalleOrden detalle = Optional.ofNullable(byId.get(item.detalleId())).orElseThrow(() -> new NotFoundException("Detalle no encontrado"));
      int nuevoTotal = detalle.getCantidadRecibida() + item.cantidadRecibida();
      if (nuevoTotal > detalle.getCantidadSolicitada()) throw new BusinessException("Cantidad recibida supera la solicitada");
      detalle.setCantidadRecibida(nuevoTotal);
      Producto producto = detalle.getProducto();
      producto.setCantidadStock(producto.getCantidadStock() + item.cantidadRecibida());
      MovimientoInventario movimiento = new MovimientoInventario();
      movimiento.setProducto(producto);
      movimiento.setCantidad(item.cantidadRecibida());
      movimiento.setTipoMovimiento(TipoMovimiento.ENTRADA);
      movimiento.setUsuarioResponsable(user);
      movimiento.setReferencia("OC-" + orden.getId());
      movimientos.save(movimiento);
      productos.save(producto);
    }
    boolean completa = orden.getDetalles().stream()
      .allMatch(detalle -> Objects.equals(detalle.getCantidadRecibida(), detalle.getCantidadSolicitada()));
    orden.setEstado(completa ? EstadoOrden.RECIBIDA : EstadoOrden.RECIBIDA_PARCIAL);
    return ordenes.save(orden);
  }

  public OrdenCompra get(Long id) {
    return ordenes.findById(id).orElseThrow(() -> new NotFoundException("Orden no encontrada"));
  }
}
