package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.MovimientoStockRequest;
import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.entity.Producto;
import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.exception.BusinessException;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.model.TipoMovimiento;
import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockMovimientoService {
  private final ProductoRepository productos;
  private final MovimientoInventarioRepository movimientos;
  private final UsuarioRepository usuarios;
  private final ProductoService productoService;

  public StockMovimientoService(ProductoRepository productos, MovimientoInventarioRepository movimientos,
                                UsuarioRepository usuarios, ProductoService productoService) {
    this.productos = productos;
    this.movimientos = movimientos;
    this.usuarios = usuarios;
    this.productoService = productoService;
  }

  @Transactional
  public MovimientoInventario registrarEntrada(MovimientoStockRequest request, Authentication auth) {
    Producto producto = productoConBloqueo(request.productoId());
    validarProductoActivo(producto);
    producto.setCantidadStock(producto.getCantidadStock() + request.cantidad());
    productos.save(producto);
    return guardarMovimiento(producto, request.cantidad(), TipoMovimiento.ENTRADA, request.referencia(), auth);
  }

  @Transactional
  public MovimientoInventario registrarSalida(MovimientoStockRequest request, Authentication auth) {
    Producto producto = productoConBloqueo(request.productoId());
    validarProductoActivo(producto);
    if (producto.getCantidadStock() < request.cantidad()) {
      throw new BusinessException("Stock insuficiente para registrar la salida");
    }
    producto.setCantidadStock(producto.getCantidadStock() - request.cantidad());
    Producto saved = productos.save(producto);
    MovimientoInventario movimiento = guardarMovimiento(saved, request.cantidad(), TipoMovimiento.SALIDA, request.referencia(), auth);
    if (saved.getCantidadStock() <= saved.getStockMinimo()) {
      productoService.notifyStock(saved);
    }
    return movimiento;
  }

  private Producto productoConBloqueo(Long id) {
    return productos.findByIdForUpdate(id).orElseThrow(() -> new NotFoundException("Producto no encontrado"));
  }

  private void validarProductoActivo(Producto producto) {
    if (!producto.isActivo()) throw new BusinessException("El producto esta inactivo");
  }

  private MovimientoInventario guardarMovimiento(Producto producto, Integer cantidad, TipoMovimiento tipo, String referencia, Authentication auth) {
    Usuario user = usuarios.findByEmail(auth.getName()).orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    MovimientoInventario movimiento = new MovimientoInventario();
    movimiento.setProducto(producto);
    movimiento.setCantidad(cantidad);
    movimiento.setTipoMovimiento(tipo);
    movimiento.setReferencia(referencia);
    movimiento.setUsuarioResponsable(user);
    return movimientos.save(movimiento);
  }
}
