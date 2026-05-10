package com.proyecto.inventario.controller;

import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movimientos")
public class MovimientoController {
  private final MovimientoInventarioRepository movimientos;

  public MovimientoController(MovimientoInventarioRepository movimientos) {
    this.movimientos = movimientos;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> list(Pageable pageable) {
    return ResponseEntity.ok(movimientos.findAll(pageable));
  }
}
