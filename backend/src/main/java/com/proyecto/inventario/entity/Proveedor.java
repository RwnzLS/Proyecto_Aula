package com.proyecto.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "proveedores", indexes = @Index(name = "idx_proveedor_nombre", columnList = "nombre"))
public class Proveedor {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @NotBlank
  private String nombre;
  @NotBlank
  @Column(name = "ruc_nit", unique = true, nullable = false)
  private String rucNit;
  @Email
  private String email;
  private String telefono;
  private String direccion;
  private boolean activo = true;

  public Long getId() { return id; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getRucNit() { return rucNit; }
  public void setRucNit(String rucNit) { this.rucNit = rucNit; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getTelefono() { return telefono; }
  public void setTelefono(String telefono) { this.telefono = telefono; }
  public String getDireccion() { return direccion; }
  public void setDireccion(String direccion) { this.direccion = direccion; }
  public boolean isActivo() { return activo; }
  public void setActivo(boolean activo) { this.activo = activo; }
}
