package com.proyecto.inventario.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;

@Entity
@Table(name = "detalles_orden")
public class DetalleOrden {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(optional = false)
  private OrdenCompra orden;
  @ManyToOne(optional = false)
  private Producto producto;
  @Min(1)
  private Integer cantidadSolicitada;
  @Min(0)
  private Integer cantidadRecibida = 0;
  @DecimalMin("0.0")
  @Column(precision = 14, scale = 2)
  private BigDecimal precioUnitario;

  public Long getId() { return id; }
  @JsonIgnore
  public OrdenCompra getOrden() { return orden; }
  public void setOrden(OrdenCompra orden) { this.orden = orden; }
  public Producto getProducto() { return producto; }
  public void setProducto(Producto producto) { this.producto = producto; }
  public Integer getCantidadSolicitada() { return cantidadSolicitada; }
  public void setCantidadSolicitada(Integer cantidadSolicitada) { this.cantidadSolicitada = cantidadSolicitada; }
  public Integer getCantidadRecibida() { return cantidadRecibida; }
  public void setCantidadRecibida(Integer cantidadRecibida) { this.cantidadRecibida = cantidadRecibida; }
  public BigDecimal getPrecioUnitario() { return precioUnitario; }
  public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
}
