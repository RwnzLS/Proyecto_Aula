package com.proyecto.inventario.controller;

import com.proyecto.inventario.dto.Dtos.UserRequest;
import com.proyecto.inventario.service.AuthService;
import com.proyecto.inventario.service.UsuarioService;
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
  private final UsuarioService service;
  private final AuthService authService;

  public UsuarioController(UsuarioService service, AuthService authService) {
    this.service = service;
    this.authService = authService;
  }

  @GetMapping
  public ResponseEntity<?> list(Pageable pageable) {
    return ResponseEntity.ok(service.list(pageable));
  }

  @PostMapping
  public ResponseEntity<?> create(@Valid @RequestBody UserRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.create(request));
  }

  @PatchMapping("/{id}/activo")
  public ResponseEntity<?> activo(@PathVariable Long id, @RequestParam boolean activo) {
    return ResponseEntity.ok(service.toggleActivo(id, activo));
  }
}
