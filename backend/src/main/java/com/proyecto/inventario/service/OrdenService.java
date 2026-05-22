package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.DetalleOrdenRequest;
import com.proyecto.inventario.dto.Dtos.OrdenRequest;
import com.proyecto.inventario.dto.Dtos.RecepcionItemRequest;
import com.proyecto.inventario.dto.Dtos.RecepcionRequest;
import com.proyecto.inventario.entity.DetalleOrden;
import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.entity.OrdenCompra;
import com.proyecto.inventario.entity.Producto;
import com.proyecto.inventario.entity.Proveedor;
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
import org.hibernate.Hibernate;
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

  @Transactional(readOnly = true)
  public Page<OrdenCompra> list(EstadoOrden estado, Long proveedorId, Pageable pageable) {
    Specification<OrdenCompra> spec = (root, query, cb) -> cb.conjunction();
    if (estado != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("estado"), estado));
    if (proveedorId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("proveedor").get("id"), proveedorId));
    Page<OrdenCompra> page = ordenes.findAll(spec, pageable);
    page.getContent().forEach(this::initLazy);
    return page;
  }

  @Transactional
  public OrdenCompra create(OrdenRequest request, Authentication auth) {
    OrdenCompra orden = new OrdenCompra();
    Proveedor proveedor = proveedores.findById(request.proveedorId()).orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));
    validarProveedorActivo(proveedor);
    orden.setProveedor(proveedor);
    orden.setUsuario(usuarios.findByEmail(auth.getName()).orElseThrow(() -> new NotFoundException("Usuario no encontrado")));
    orden.setFechaEsperada(request.fechaEsperada());
    orden.setObservaciones(request.observaciones());
    BigDecimal total = BigDecimal.ZERO;
    for (DetalleOrdenRequest item : request.detalles()) {
      DetalleOrden detalle = new DetalleOrden();
      detalle.setOrden(orden);
      Producto producto = productos.findById(item.productoId()).orElseThrow(() -> new NotFoundException("Producto no encontrado"));
      validarProductoActivo(producto);
      detalle.setProducto(producto);
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
    OrdenCompra orden = getForUpdate(id);
    if (orden.getEstado() != EstadoOrden.BORRADOR) throw new BusinessException("Solo se pueden enviar ordenes en borrador");
    orden.setEstado(EstadoOrden.ENVIADA);
    OrdenCompra saved = ordenes.save(orden);
    initLazy(saved);
    email.sendTemplate(saved.getProveedor().getEmail(), "Orden de compra #" + saved.getId(), "orden-enviada",
      Map.of("ordenId", saved.getId(), "total", saved.getTotal()));
    return saved;
  }

  @Transactional
  public OrdenCompra recepcion(Long id, RecepcionRequest request, Authentication auth) {
    OrdenCompra orden = getForUpdate(id);
    if (orden.getEstado() != EstadoOrden.ENVIADA && orden.getEstado() != EstadoOrden.RECIBIDA_PARCIAL) {
      throw new BusinessException("Solo se puede recibir mercancia en ordenes ENVIADA o RECIBIDA_PARCIAL");
    }
    Usuario user = usuarios.findByEmail(auth.getName()).orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    Map<Long, DetalleOrden> byId = orden.getDetalles().stream().collect(Collectors.toMap(DetalleOrden::getId, d -> d));
    for (RecepcionItemRequest item : request.items()) {
      DetalleOrden detalle = Optional.ofNullable(byId.get(item.detalleId())).orElseThrow(() -> new NotFoundException("Detalle no encontrado"));
      int nuevoTotal = detalle.getCantidadRecibida() + item.cantidadRecibida();
      if (nuevoTotal > detalle.getCantidadSolicitada()) throw new BusinessException("Cantidad recibida supera la solicitada");
      detalle.setCantidadRecibida(nuevoTotal);
      Producto producto = productos.findByIdForUpdate(detalle.getProducto().getId())
        .orElseThrow(() -> new NotFoundException("Producto no encontrado"));
      validarProductoActivo(producto);
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
    OrdenCompra saved = ordenes.save(orden);
    initLazy(saved);
    return saved;
  }

  @Transactional
  public OrdenCompra cancelar(Long id) {
    OrdenCompra orden = getForUpdate(id);
    if (orden.getEstado() == EstadoOrden.RECIBIDA || orden.getEstado() == EstadoOrden.CANCELADA) {
      throw new BusinessException("No se puede cancelar una orden en estado " + orden.getEstado());
    }
    orden.setEstado(EstadoOrden.CANCELADA);
    OrdenCompra saved = ordenes.save(orden);
    initLazy(saved);
    return saved;
  }

  @Transactional(readOnly = true)
  public OrdenCompra get(Long id) {
    OrdenCompra orden = ordenes.findById(id).orElseThrow(() -> new NotFoundException("Orden no encontrada"));
    initLazy(orden);
    return orden;
  }

  private void initLazy(OrdenCompra o) {
    Hibernate.initialize(o.getProveedor());
    Hibernate.initialize(o.getUsuario());
    Hibernate.initialize(o.getDetalles());
    o.getDetalles().forEach(d -> Hibernate.initialize(d.getProducto()));
  }

  private OrdenCompra getForUpdate(Long id) {
    return ordenes.findByIdForUpdate(id).orElseThrow(() -> new NotFoundException("Orden no encontrada"));
  }

  private void validarProductoActivo(Producto producto) {
    if (!producto.isActivo()) throw new BusinessException("El producto esta inactivo");
  }

  private void validarProveedorActivo(Proveedor proveedor) {
    if (!proveedor.isActivo()) throw new BusinessException("El proveedor esta inactivo");
  }
}
