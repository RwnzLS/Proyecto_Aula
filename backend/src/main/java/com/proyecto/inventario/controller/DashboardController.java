package com.proyecto.inventario.controller;

import com.proyecto.inventario.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
  private final DashboardService service;

  public DashboardController(DashboardService service) {
    this.service = service;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> kpis() {
    return ResponseEntity.ok(service.kpis());
  }

  @GetMapping("/resumen")
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> resumen() {
    return ResponseEntity.ok(service.resumen());
  }
}
