package com.proyecto.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "precios_proveedor", indexes = {
  @Index(name = "idx_precio_producto", columnList = "producto_id"),
  @Index(name = "idx_precio_proveedor", columnList = "proveedor_id")
})
public class PrecioProveedor {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(optional = false)
  private Proveedor proveedor;
  @ManyToOne(optional = false)
  private Producto producto;
  @DecimalMin("0.0")
  @Column(precision = 14, scale = 2)
  private BigDecimal precioUnitario;
  private String moneda = "COP";
  private Instant fechaRegistro = Instant.now();

  public Long getId() { return id; }
  public Proveedor getProveedor() { return proveedor; }
  public void setProveedor(Proveedor proveedor) { this.proveedor = proveedor; }
  public Producto getProducto() { return producto; }
  public void setProducto(Producto producto) { this.producto = producto; }
  public BigDecimal getPrecioUnitario() { return precioUnitario; }
  public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
  public String getMoneda() { return moneda; }
  public void setMoneda(String moneda) { this.moneda = moneda; }
  public Instant getFechaRegistro() { return fechaRegistro; }
}
