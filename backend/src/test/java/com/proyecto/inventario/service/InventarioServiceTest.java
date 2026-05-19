package com.proyecto.inventario.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.proyecto.inventario.dto.Dtos.AjusteStockRequest;
import com.proyecto.inventario.dto.Dtos.MovimientoStockRequest;
import com.proyecto.inventario.dto.Dtos.ProductoRequest;
import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.entity.Producto;
import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.exception.BusinessException;
import com.proyecto.inventario.model.Rol;
import com.proyecto.inventario.model.TipoMovimiento;
import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.UsuarioRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@ExtendWith(MockitoExtension.class)
class InventarioServiceTest {
  private ProductoRepository productos;
  private MovimientoInventarioRepository movimientos;
  private UsuarioRepository usuarios;
  private ProductoService productoService;
  private StockMovimientoService stockMovimientoService;
  private Authentication auth;
  private Usuario usuario;

  @BeforeEach
  void setUp() {
    productos = mock(ProductoRepository.class);
    movimientos = mock(MovimientoInventarioRepository.class);
    usuarios = mock(UsuarioRepository.class);
    usuario = new Usuario();
    usuario.setEmail("almacen@inventario.local");
    usuario.setRol(Rol.ALMACENISTA);
    auth = new UsernamePasswordAuthenticationToken(usuario.getEmail(), "password");

    productoService = new ProductoService(productos, movimientos, usuarios, null, "ops@inventario.local");
    stockMovimientoService = new StockMovimientoService(productos, movimientos, usuarios, productoService);

    lenient().when(usuarios.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
    lenient().when(movimientos.save(any(MovimientoInventario.class))).thenAnswer(invocation -> invocation.getArgument(0));
    lenient().when(productos.save(any(Producto.class))).thenAnswer(invocation -> invocation.getArgument(0));
  }

  @Test
  void registrarEntradaSumaStockYCreaMovimiento() {
    Producto producto = producto(10, 3, true);
    when(productos.findByIdForUpdate(1L)).thenReturn(Optional.of(producto));

    MovimientoInventario movimiento = stockMovimientoService.registrarEntrada(new MovimientoStockRequest(1L, 5, "Entrada manual"), auth);

    assertThat(producto.getCantidadStock()).isEqualTo(15);
    assertThat(movimiento.getTipoMovimiento()).isEqualTo(TipoMovimiento.ENTRADA);
    assertThat(movimiento.getCantidad()).isEqualTo(5);
    assertThat(movimiento.getReferencia()).isEqualTo("Entrada manual");
  }

  @Test
  void registrarSalidaRestaStockYCreaMovimiento() {
    Producto producto = producto(10, 3, true);
    when(productos.findByIdForUpdate(1L)).thenReturn(Optional.of(producto));

    MovimientoInventario movimiento = stockMovimientoService.registrarSalida(new MovimientoStockRequest(1L, 4, "Salida manual"), auth);

    assertThat(producto.getCantidadStock()).isEqualTo(6);
    assertThat(movimiento.getTipoMovimiento()).isEqualTo(TipoMovimiento.SALIDA);
    assertThat(movimiento.getCantidad()).isEqualTo(4);
  }

  @Test
  void registrarSalidaFallaConStockInsuficiente() {
    Producto producto = producto(3, 1, true);
    when(productos.findByIdForUpdate(1L)).thenReturn(Optional.of(producto));

    assertThatThrownBy(() -> stockMovimientoService.registrarSalida(new MovimientoStockRequest(1L, 4, "Salida manual"), auth))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("Stock insuficiente");

    verify(movimientos, never()).save(any());
  }

  @Test
  void registrarMovimientoFallaSiProductoEstaInactivo() {
    Producto producto = producto(10, 3, false);
    when(productos.findByIdForUpdate(1L)).thenReturn(Optional.of(producto));

    assertThatThrownBy(() -> stockMovimientoService.registrarEntrada(new MovimientoStockRequest(1L, 2, "Entrada manual"), auth))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("inactivo");

    verify(movimientos, never()).save(any());
  }

  @Test
  void ajustarStockPositivoSumaYCreaMovimiento() {
    Producto producto = producto(10, 3, true);
    when(productos.findByIdForUpdate(1L)).thenReturn(Optional.of(producto));

    Producto saved = productoService.ajustar(1L, new AjusteStockRequest(7, "Conteo fisico"), auth);

    assertThat(saved.getCantidadStock()).isEqualTo(17);
    verify(movimientos).save(any(MovimientoInventario.class));
  }

  @Test
  void ajustarStockNegativoValidoRestaYCreaMovimiento() {
    Producto producto = producto(10, 3, true);
    when(productos.findByIdForUpdate(1L)).thenReturn(Optional.of(producto));

    Producto saved = productoService.ajustar(1L, new AjusteStockRequest(-4, "Merma"), auth);

    assertThat(saved.getCantidadStock()).isEqualTo(6);
    verify(movimientos).save(any(MovimientoInventario.class));
  }

  @Test
  void ajustarStockCeroFalla() {
    Producto producto = producto(10, 3, true);
    when(productos.findByIdForUpdate(1L)).thenReturn(Optional.of(producto));

    assertThatThrownBy(() -> productoService.ajustar(1L, new AjusteStockRequest(0, "Sin cambio"), auth))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("cero");

    verify(movimientos, never()).save(any());
  }

  @Test
  void ajustarStockNoPuedeDejarStockNegativo() {
    Producto producto = producto(5, 1, true);
    when(productos.findByIdForUpdate(1L)).thenReturn(Optional.of(producto));

    assertThatThrownBy(() -> productoService.ajustar(1L, new AjusteStockRequest(-6, "Error"), auth))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("negativo");

    verify(movimientos, never()).save(any());
  }

  @Test
  void actualizarProductoNoCambiaActivoCuandoVieneNulo() {
    Producto producto = producto(10, 3, false);
    when(productos.findById(1L)).thenReturn(Optional.of(producto));

    Producto saved = productoService.update(1L, productoRequest(null, 10));

    assertThat(saved.isActivo()).isFalse();
  }

  @Test
  void actualizarProductoIgnoraActivoDelRequest() {
    Producto producto = producto(10, 3, true);
    when(productos.findById(1L)).thenReturn(Optional.of(producto));

    Producto saved = productoService.update(1L, productoRequest(false, 10));

    assertThat(saved.isActivo()).isTrue();
  }

  @Test
  void reactivarPoneProductoComoActivo() {
    Producto producto = producto(10, 3, false);
    when(productos.findById(1L)).thenReturn(Optional.of(producto));

    Producto saved = productoService.reactivar(1L);

    assertThat(saved.isActivo()).isTrue();
  }

  private Producto producto(int stock, int minimo, boolean activo) {
    Producto producto = new Producto();
    producto.setNombre("Producto test");
    producto.setCodigo("TEST");
    producto.setCantidadStock(stock);
    producto.setStockMinimo(minimo);
    producto.setActivo(activo);
    return producto;
  }

  private ProductoRequest productoRequest(Boolean activo, Integer cantidadStock) {
    return new ProductoRequest(
      "Producto actualizado",
      "Descripcion",
      "TEST",
      "Categoria",
      cantidadStock,
      3,
      "unidad",
      activo
    );
  }
}
