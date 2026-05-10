package com.proyecto.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "productos", indexes = {
  @Index(name = "idx_producto_nombre", columnList = "nombre"),
  @Index(name = "idx_producto_categoria", columnList = "categoria")
})
public class Producto {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @NotBlank
  private String nombre;
  private String descripcion;
  @NotBlank
  @Column(unique = true, nullable = false)
  private String codigo;
  private String categoria;
  @Min(0)
  private Integer cantidadStock = 0;
  @Min(0)
  private Integer stockMinimo = 0;
  private String unidadMedida;
  private boolean activo = true;

  public Long getId() { return id; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getDescripcion() { return descripcion; }
  public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
  public String getCodigo() { return codigo; }
  public void setCodigo(String codigo) { this.codigo = codigo; }
  public String getCategoria() { return categoria; }
  public void setCategoria(String categoria) { this.categoria = categoria; }
  public Integer getCantidadStock() { return cantidadStock; }
  public void setCantidadStock(Integer cantidadStock) { this.cantidadStock = cantidadStock; }
  public Integer getStockMinimo() { return stockMinimo; }
  public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }
  public String getUnidadMedida() { return unidadMedida; }
  public void setUnidadMedida(String unidadMedida) { this.unidadMedida = unidadMedida; }
  public boolean isActivo() { return activo; }
  public void setActivo(boolean activo) { this.activo = activo; }
}
