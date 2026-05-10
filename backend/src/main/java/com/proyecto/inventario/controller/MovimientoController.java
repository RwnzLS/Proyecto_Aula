package com.proyecto.inventario.controller;

import com.proyecto.inventario.service.MovimientoService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movimientos")
public class MovimientoController {
  private final MovimientoService service;

  public MovimientoController(MovimientoService service) {
    this.service = service;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> list(@RequestParam(required = false) Long productoId, Pageable pageable) {
    return ResponseEntity.ok(service.list(productoId, pageable));
  }
}
