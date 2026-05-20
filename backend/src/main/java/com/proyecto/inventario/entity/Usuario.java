package com.proyecto.inventario.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.proyecto.inventario.model.Rol;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

@Entity
@Table(name = "users")
public class Usuario {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @NotBlank
  private String nombre;
  @Email
  @Column(unique = true, nullable = false)
  private String email;
  @Column(nullable = false)
  private String password;
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Rol rol;
  private boolean activo = true;
  private Instant fechaCreacion = Instant.now();

  public Long getId() { return id; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  @JsonIgnore
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
  public Rol getRol() { return rol; }
  public void setRol(Rol rol) { this.rol = rol; }
  public boolean isActivo() { return activo; }
  public void setActivo(boolean activo) { this.activo = activo; }
  public Instant getFechaCreacion() { return fechaCreacion; }
}
