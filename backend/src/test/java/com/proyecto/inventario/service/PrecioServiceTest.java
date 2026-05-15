package com.proyecto.inventario.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.proyecto.inventario.dto.Dtos.PrecioRequest;
import com.proyecto.inventario.entity.PrecioProveedor;
import com.proyecto.inventario.entity.Producto;
import com.proyecto.inventario.entity.Proveedor;
import com.proyecto.inventario.exception.BusinessException;
import com.proyecto.inventario.repository.PrecioProveedorRepository;
import com.proyecto.inventario.repository.ProductoRepository;
import com.proyecto.inventario.repository.ProveedorRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class PrecioServiceTest {
  private PrecioProveedorRepository precios;
  private ProductoRepository productos;
  private ProveedorRepository proveedores;
  private PrecioService service;

  @BeforeEach
  void setUp() {
    precios = mock(PrecioProveedorRepository.class);
    productos = mock(ProductoRepository.class);
    proveedores = mock(ProveedorRepository.class);
    service = new PrecioService(precios, productos, proveedores);
  }

  @Test
  void crearPrecioRequiereProductoYProveedorActivos() {
    Producto producto = producto(true);
    Proveedor proveedor = proveedor(true);
    when(productos.findById(1L)).thenReturn(Optional.of(producto));
    when(proveedores.findById(1L)).thenReturn(Optional.of(proveedor));
    when(precios.save(any(PrecioProveedor.class))).thenAnswer(invocation -> invocation.getArgument(0));

    PrecioProveedor precio = service.create(new PrecioRequest(1L, 1L, BigDecimal.valueOf(1500), "COP"));

    assertThat(precio.getProducto()).isEqualTo(producto);
    assertThat(precio.getProveedor()).isEqualTo(proveedor);
    assertThat(precio.getPrecioUnitario()).isEqualByComparingTo("1500");
  }

  @Test
  void crearPrecioFallaConProductoInactivo() {
    when(productos.findById(1L)).thenReturn(Optional.of(producto(false)));
    when(proveedores.findById(1L)).thenReturn(Optional.of(proveedor(true)));

    assertThatThrownBy(() -> service.create(new PrecioRequest(1L, 1L, BigDecimal.valueOf(1500), "COP")))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("producto");
  }

  @Test
  void ultimoDevuelvePrecioMasRecienteDisponible() {
    PrecioProveedor esperado = new PrecioProveedor();
    when(precios.findUltimosActivos(any(), any(), any(Pageable.class))).thenReturn(List.of(esperado));

    assertThat(service.ultimo(1L, 1L)).isSameAs(esperado);
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
