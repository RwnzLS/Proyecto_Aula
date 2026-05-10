package com.proyecto.inventario.controller;

import com.proyecto.inventario.dto.Dtos.UserRequest;
import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.repository.UsuarioRepository;
import com.proyecto.inventario.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {
  private final UsuarioRepository usuarios;
  private final AuthService authService;

  public UsuarioController(UsuarioRepository usuarios, AuthService authService) {
    this.usuarios = usuarios;
    this.authService = authService;
  }

  @GetMapping
  public ResponseEntity<?> list(Pageable pageable) {
    return ResponseEntity.ok(usuarios.findAll(pageable));
  }

  @PostMapping
  public ResponseEntity<?> create(@Valid @RequestBody UserRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.create(request));
  }

  @PatchMapping("/{id}/activo")
  public ResponseEntity<?> activo(@PathVariable Long id, @RequestParam boolean activo) {
    Usuario usuario = usuarios.findById(id).orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    usuario.setActivo(activo);
    return ResponseEntity.ok(usuarios.save(usuario));
  }
}
