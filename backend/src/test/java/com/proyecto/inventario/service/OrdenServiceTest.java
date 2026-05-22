package com.proyecto.inventario.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.proyecto.inventario.model.EstadoOrden;
import com.proyecto.inventario.model.Rol;
import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import com.proyecto.inventario.repository.OrdenCompraRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.ProveedorRepository;
import com.proyecto.inventario.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class OrdenServiceTest {
  private OrdenCompraRepository ordenes;
  private ProductoRepository productos;
  private ProveedorRepository proveedores;
  private UsuarioRepository usuarios;
  private MovimientoInventarioRepository movimientos;
  private EmailService email;
  private OrdenService service;
  private Authentication auth;

  @BeforeEach
  void setUp() {
    ordenes = mock(OrdenCompraRepository.class);
    productos = mock(ProductoRepository.class);
    proveedores = mock(ProveedorRepository.class);
    usuarios = mock(UsuarioRepository.class);
    movimientos = mock(MovimientoInventarioRepository.class);
    email = mock(EmailService.class);
    service = new OrdenService(ordenes, productos, proveedores, usuarios, movimientos, email);

    Usuario usuario = new Usuario();
    usuario.setEmail("gerente@inventario.local");
    usuario.setRol(Rol.GERENTE);
    auth = new UsernamePasswordAuthenticationToken(usuario.getEmail(), "password");
    lenient().when(usuarios.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
    lenient().when(ordenes.save(any(OrdenCompra.class))).thenAnswer(invocation -> invocation.getArgument(0));
    lenient().when(movimientos.save(any(MovimientoInventario.class))).thenAnswer(invocation -> invocation.getArgument(0));
  }

  @Test
  void crearOrdenCalculaTotalYGuardaPrecioSnapshot() {
    when(proveedores.findById(1L)).thenReturn(Optional.of(proveedor(true)));
    when(productos.findById(1L)).thenReturn(Optional.of(producto(true)));

    OrdenCompra orden = service.create(new OrdenRequest(
      1L,
      LocalDate.of(2026, 6, 1),
      "Orden test",
      List.of(new DetalleOrdenRequest(1L, 3, BigDecimal.valueOf(2000)))
    ), auth);

    assertThat(orden.getTotal()).isEqualByComparingTo("6000");
    assertThat(orden.getDetalles()).hasSize(1);
    assertThat(orden.getDetalles().get(0).getPrecioUnitario()).isEqualByComparingTo("2000");
  }

  @Test
  void crearOrdenFallaConProveedorInactivo() {
    when(proveedores.findById(1L)).thenReturn(Optional.of(proveedor(false)));

    assertThatThrownBy(() -> service.create(requestBasico(), auth))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("proveedor");
  }

  @Test
  void crearOrdenFallaConProductoInactivo() {
    when(proveedores.findById(1L)).thenReturn(Optional.of(proveedor(true)));
    when(productos.findById(1L)).thenReturn(Optional.of(producto(false)));

    assertThatThrownBy(() -> service.create(requestBasico(), auth))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("producto");
  }

  @Test
  void enviarCargaOrdenConBloqueoPesimista() {
    Proveedor proveedor = proveedor(true);
    proveedor.setEmail("proveedor@inventario.local");
    OrdenCompra orden = new OrdenCompra();
    ReflectionTestUtils.setField(orden, "id", 1L);
    orden.setProveedor(proveedor);
    orden.setEstado(EstadoOrden.BORRADOR);
    when(ordenes.findByIdForUpdate(1L)).thenReturn(Optional.of(orden));

    OrdenCompra enviada = service.enviar(1L);

    verify(ordenes).findByIdForUpdate(1L);
    verify(ordenes, never()).findById(1L);
    verify(email).sendTemplate(eq("proveedor@inventario.local"), eq("Orden de compra #1"), eq("orden-enviada"), any());
    assertThat(enviada.getEstado()).isEqualTo(EstadoOrden.ENVIADA);
  }

  @Test
  void recepcionActualizaStockYEstadoEnParcial() {
    Producto producto = producto(true);
    producto.setCantidadStock(10);
    ReflectionTestUtils.setField(producto, "id", 2L);
    DetalleOrden detalle = new DetalleOrden();
    ReflectionTestUtils.setField(detalle, "id", 10L);
    detalle.setProducto(producto);
    detalle.setCantidadSolicitada(5);
    detalle.setCantidadRecibida(0);
    OrdenCompra orden = new OrdenCompra();
    ReflectionTestUtils.setField(orden, "id", 1L);
    orden.setEstado(EstadoOrden.ENVIADA);
    orden.getDetalles().add(detalle);

    when(ordenes.findByIdForUpdate(1L)).thenReturn(Optional.of(orden));
    when(productos.findByIdForUpdate(2L)).thenReturn(Optional.of(producto));

    OrdenCompra recibida = service.recepcion(1L, new RecepcionRequest(List.of(new RecepcionItemRequest(10L, 3))), auth);

    verify(ordenes).findByIdForUpdate(1L);
    verify(ordenes, never()).findById(1L);
    assertThat(detalle.getCantidadRecibida()).isEqualTo(3);
    assertThat(producto.getCantidadStock()).isEqualTo(13);
    assertThat(recibida.getEstado()).isEqualTo(EstadoOrden.RECIBIDA_PARCIAL);
  }

  @Test
  void recepcionCompletaTransicionaARecibida() {
    Producto producto = producto(true);
    producto.setCantidadStock(2);
    producto.setStockMinimo(4);
    ReflectionTestUtils.setField(producto, "id", 2L);
    DetalleOrden detalle = new DetalleOrden();
    ReflectionTestUtils.setField(detalle, "id", 10L);
    detalle.setProducto(producto);
    detalle.setCantidadSolicitada(5);
    detalle.setCantidadRecibida(0);
    OrdenCompra orden = new OrdenCompra();
    ReflectionTestUtils.setField(orden, "id", 1L);
    orden.setEstado(EstadoOrden.ENVIADA);
    orden.getDetalles().add(detalle);

    when(ordenes.findByIdForUpdate(1L)).thenReturn(Optional.of(orden));
    when(productos.findByIdForUpdate(2L)).thenReturn(Optional.of(producto));

    OrdenCompra recibida = service.recepcion(1L, new RecepcionRequest(List.of(new RecepcionItemRequest(10L, 5))), auth);

    assertThat(producto.getCantidadStock()).isEqualTo(7);
    assertThat(recibida.getEstado()).isEqualTo(EstadoOrden.RECIBIDA);
  }

  @Test
  void cancelarCargaOrdenConBloqueoPesimista() {
    OrdenCompra orden = new OrdenCompra();
    orden.setEstado(EstadoOrden.BORRADOR);
    when(ordenes.findByIdForUpdate(1L)).thenReturn(Optional.of(orden));

    OrdenCompra cancelada = service.cancelar(1L);

    verify(ordenes).findByIdForUpdate(1L);
    verify(ordenes, never()).findById(1L);
    assertThat(cancelada.getEstado()).isEqualTo(EstadoOrden.CANCELADA);
  }

  private OrdenRequest requestBasico() {
    return new OrdenRequest(1L, LocalDate.of(2026, 6, 1), "Orden test",
      List.of(new DetalleOrdenRequest(1L, 3, BigDecimal.valueOf(2000))));
  }

  private Producto producto(boolean activo) {
    Producto producto = new Producto();
    producto.setNombre("Producto test");
    producto.setCodigo("TEST");
    producto.setActivo(activo);
    return producto;
  }

  private Proveedor proveedor(boolean activo) {
    Proveedor proveedor = new Proveedor();
    proveedor.setNombre("Proveedor test");
    proveedor.setActivo(activo);
    return proveedor;
  }
}
