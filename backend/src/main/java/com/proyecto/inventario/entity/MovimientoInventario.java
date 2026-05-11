package com.proyecto.inventario.entity;

import com.proyecto.inventario.model.TipoMovimiento;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "movimientos_inventario", indexes = {
  @Index(name = "idx_mov_producto", columnList = "producto_id"),
  @Index(name = "idx_mov_fecha", columnList = "fecha"),
  @Index(name = "idx_mov_tipo_fecha", columnList = "tipo_movimiento, fecha"),
  @Index(name = "idx_mov_producto_fecha", columnList = "producto_id, fecha")
})
public class MovimientoInventario {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(optional = false)
  private Producto producto;
  @Enumerated(EnumType.STRING)
  private TipoMovimiento tipoMovimiento;
  private Integer cantidad;
  @ManyToOne(optional = false)
  private Usuario usuarioResponsable;
  private String referencia;
  private Instant fecha = Instant.now();

  public Long getId() { return id; }
  public Producto getProducto() { return producto; }
  public void setProducto(Producto producto) { this.producto = producto; }
  public TipoMovimiento getTipoMovimiento() { return tipoMovimiento; }
  public void setTipoMovimiento(TipoMovimiento tipoMovimiento) { this.tipoMovimiento = tipoMovimiento; }
  public Integer getCantidad() { return cantidad; }
  public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
  public Usuario getUsuarioResponsable() { return usuarioResponsable; }
  public void setUsuarioResponsable(Usuario usuarioResponsable) { this.usuarioResponsable = usuarioResponsable; }
  public String getReferencia() { return referencia; }
  public void setReferencia(String referencia) { this.referencia = referencia; }
  public Instant getFecha() { return fecha; }
}
