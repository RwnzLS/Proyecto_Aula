package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.AjusteStockRequest;
import com.proyecto.inventario.dto.Dtos.ProductoRequest;
import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.entity.Producto;
import com.proyecto.inventario.exception.BusinessException;
import com.proyecto.inventario.model.Rol;
import com.proyecto.inventario.model.TipoMovimiento;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.UsuarioRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductoService {
  private final ProductoRepository productos;
  private final MovimientoInventarioRepository movimientos;
  private final UsuarioRepository usuarios;
  private final EmailService email;
  private final String opsEmail;

  public ProductoService(ProductoRepository productos, MovimientoInventarioRepository movimientos, UsuarioRepository usuarios,
                         EmailService email, @Value("${app.mail.ops-email}") String opsEmail) {
    this.productos = productos;
    this.movimientos = movimientos;
    this.usuarios = usuarios;
    this.email = email;
    this.opsEmail = opsEmail;
  }

  @Transactional(readOnly = true)
  public Page<Producto> list(String categoria, String nombre, Boolean stockBajo, Boolean activo, Pageable pageable) {
    boolean soloActivos = activo == null || activo;
    Specification<Producto> spec = (root, query, cb) -> cb.equal(root.get("activo"), soloActivos);
    if (categoria != null && !categoria.isBlank()) spec = spec.and((r, q, cb) -> cb.equal(r.get("categoria"), categoria));
    if (nombre != null && !nombre.isBlank()) spec = spec.and((r, q, cb) -> cb.like(cb.lower(r.get("nombre")), "%" + nombre.toLowerCase() + "%"));
    if (Boolean.TRUE.equals(stockBajo)) spec = spec.and((r, q, cb) -> cb.lessThanOrEqualTo(r.get("cantidadStock"), r.get("stockMinimo")));
    return productos.findAll(spec, pageable);
  }

  @Transactional(readOnly = true)
  public List<Producto> stockBajo() {
    return productos.findAll((root, query, cb) -> cb.and(
      cb.isTrue(root.get("activo")),
      cb.lessThanOrEqualTo(root.get("cantidadStock"), root.get("stockMinimo"))
    ));
  }

  @Transactional
  public Producto create(ProductoRequest request) {
    Producto producto = new Producto();
    copyCreate(request, producto);
    return productos.save(producto);
  }

  @Transactional
  public Producto update(Long id, ProductoRequest request) {
    Producto producto = get(id);
    copyUpdate(request, producto);
    return productos.save(producto);
  }

  @Transactional
  public void delete(Long id) {
    Producto producto = get(id);
    producto.setActivo(false);
    productos.save(producto);
  }

  @Transactional
  public Producto reactivar(Long id) {
    Producto producto = get(id);
    producto.setActivo(true);
    return productos.save(producto);
  }

  @Transactional(readOnly = true)
  public Producto get(Long id) {
    return productos.findById(id).orElseThrow(() -> new NotFoundException("Producto no encontrado"));
  }

  @Transactional
  public Producto ajustar(Long id, AjusteStockRequest request, Authentication auth) {
    Producto producto = productos.findByIdForUpdate(id).orElseThrow(() -> new NotFoundException("Producto no encontrado"));
    validarProductoActivo(producto);
    int cantidad = request.cantidad();
    if (cantidad == 0) throw new BusinessException("La cantidad del ajuste no puede ser cero");
    int nuevoStock = producto.getCantidadStock() + cantidad;
    if (nuevoStock < 0) throw new BusinessException("El ajuste no puede dejar el stock en negativo");
    producto.setCantidadStock(nuevoStock);
    MovimientoInventario movimiento = new MovimientoInventario();
    movimiento.setProducto(producto);
    movimiento.setCantidad(cantidad);
    movimiento.setTipoMovimiento(TipoMovimiento.AJUSTE);
    movimiento.setReferencia(request.motivo());
    movimiento.setUsuarioResponsable(usuarios.findByEmail(auth.getName()).orElseThrow());
    movimientos.save(movimiento);
    Producto saved = productos.save(producto);
    if (cantidad < 0 && saved.getCantidadStock() <= saved.getStockMinimo()) notifyStock(saved);
    return saved;
  }

  public void notifyStock(Producto producto) {
    List<String> recipients = usuarios.findByRolInAndActivoTrue(List.of(Rol.ADMIN, Rol.GERENTE)).stream()
      .map(usuario -> usuario.getEmail())
      .toList();
    if (recipients.isEmpty()) recipients = List.of(opsEmail);
    for (String to : recipients) {
      email.sendTemplate(to, "Alerta de stock bajo", "stock-bajo",
        Map.of("producto", producto.getNombre(), "stock", producto.getCantidadStock()));
    }
  }

  private void copyCreate(ProductoRequest request, Producto producto) {
    copyBase(request, producto);
    producto.setCantidadStock(Optional.ofNullable(request.cantidadStock()).orElse(0));
    producto.setActivo(request.activo() == null || request.activo());
  }

  private void copyUpdate(ProductoRequest request, Producto producto) {
    Integer requestedStock = Optional.ofNullable(request.cantidadStock()).orElse(producto.getCantidadStock());
    if (!requestedStock.equals(producto.getCantidadStock())) {
      throw new BusinessException("El stock no se puede editar directamente; usa entrada, salida, ajuste o recepcion");
    }
    copyBase(request, producto);
  }

  private void copyBase(ProductoRequest request, Producto producto) {
    producto.setNombre(request.nombre());
    producto.setDescripcion(request.descripcion());
    producto.setCodigo(request.codigo());
    producto.setCategoria(request.categoria());
    producto.setStockMinimo(Optional.ofNullable(request.stockMinimo()).orElse(0));
    producto.setUnidadMedida(request.unidadMedida());
  }

  private void validarProductoActivo(Producto producto) {
    if (!producto.isActivo()) throw new BusinessException("El producto esta inactivo");
  }
}
