package com.proyecto.inventario.controller;

import com.proyecto.inventario.dto.Dtos.MovimientoStockRequest;
import com.proyecto.inventario.service.StockMovimientoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/salidas")
public class SalidaController {
  private final StockMovimientoService service;

  public SalidaController(StockMovimientoService service) {
    this.service = service;
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
  public ResponseEntity<?> registrar(@Valid @RequestBody MovimientoStockRequest request, Authentication auth) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarSalida(request, auth));
  }
}
