package com.proyecto.inventario.entity;

import com.proyecto.inventario.model.EstadoOrden;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordenes_compra")
public class OrdenCompra {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(optional = false)
  private Proveedor proveedor;
  @ManyToOne(optional = false)
  private Usuario usuario;
  private Instant fechaCreacion = Instant.now();
  private LocalDate fechaEsperada;
  @Enumerated(EnumType.STRING)
  private EstadoOrden estado = EstadoOrden.BORRADOR;
  private String observaciones;
  @Column(precision = 14, scale = 2)
  private BigDecimal total = BigDecimal.ZERO;
  @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<DetalleOrden> detalles = new ArrayList<>();

  public Long getId() { return id; }
  public Proveedor getProveedor() { return proveedor; }
  public void setProveedor(Proveedor proveedor) { this.proveedor = proveedor; }
  public Usuario getUsuario() { return usuario; }
  public void setUsuario(Usuario usuario) { this.usuario = usuario; }
  public Instant getFechaCreacion() { return fechaCreacion; }
  public LocalDate getFechaEsperada() { return fechaEsperada; }
  public void setFechaEsperada(LocalDate fechaEsperada) { this.fechaEsperada = fechaEsperada; }
  public EstadoOrden getEstado() { return estado; }
  public void setEstado(EstadoOrden estado) { this.estado = estado; }
  public String getObservaciones() { return observaciones; }
  public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
  public BigDecimal getTotal() { return total; }
  public void setTotal(BigDecimal total) { this.total = total; }
  public List<DetalleOrden> getDetalles() { return detalles; }
}
