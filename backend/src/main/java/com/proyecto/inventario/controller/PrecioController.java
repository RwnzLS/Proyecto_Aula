package com.proyecto.inventario.controller;

import com.proyecto.inventario.dto.Dtos.PrecioRequest;
import com.proyecto.inventario.service.PrecioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/precios")
public class PrecioController {
  private final PrecioService service;

  public PrecioController(PrecioService service) {
    this.service = service;
  }

  @GetMapping("/historial")
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> historial(@RequestParam(required = false) Long productoId,
                                     @RequestParam(required = false) Long proveedorId) {
    return ResponseEntity.ok(service.historial(productoId, proveedorId));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE')")
  public ResponseEntity<?> create(@Valid @RequestBody PrecioRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
  }
}
