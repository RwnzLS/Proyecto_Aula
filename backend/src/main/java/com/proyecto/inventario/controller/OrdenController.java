package com.proyecto.inventario.controller;

import com.proyecto.inventario.dto.Dtos.OrdenRequest;
import com.proyecto.inventario.dto.Dtos.RecepcionRequest;
import com.proyecto.inventario.model.EstadoOrden;
import com.proyecto.inventario.service.OrdenService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ordenes")
public class OrdenController {
  private final OrdenService service;

  public OrdenController(OrdenService service) {
    this.service = service;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> list(@RequestParam(required = false) EstadoOrden estado,
                                @RequestParam(required = false) Long proveedorId,
                                Pageable pageable) {
    return ResponseEntity.ok(service.list(estado, proveedorId, pageable));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE')")
  public ResponseEntity<?> create(@Valid @RequestBody OrdenRequest request, Authentication auth) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, auth));
  }

  @PutMapping("/{id}/enviar")
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE')")
  public ResponseEntity<?> enviar(@PathVariable Long id) {
    return ResponseEntity.ok(service.enviar(id));
  }

  @PostMapping("/{id}/recepcion")
  @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
  public ResponseEntity<?> recepcion(@PathVariable Long id, @Valid @RequestBody RecepcionRequest request, Authentication auth) {
    return ResponseEntity.ok(service.recepcion(id, request, auth));
  }
}
