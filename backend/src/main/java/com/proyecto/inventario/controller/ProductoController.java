package com.proyecto.inventario.controller;

import com.proyecto.inventario.dto.Dtos.AjusteStockRequest;
import com.proyecto.inventario.dto.Dtos.ProductoRequest;
import com.proyecto.inventario.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {
  private final ProductoService service;

  public ProductoController(ProductoService service) {
    this.service = service;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> list(@RequestParam(required = false) String categoria,
                                @RequestParam(required = false) String nombre,
                                @RequestParam(required = false) Boolean stockBajo,
                                Pageable pageable) {
    return ResponseEntity.ok(service.list(categoria, nombre, stockBajo, pageable));
  }

  @GetMapping("/stock-bajo")
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> stockBajo() {
    return ResponseEntity.ok(service.stockBajo());
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','GERENTE','ALMACENISTA')")
  public ResponseEntity<?> get(@PathVariable Long id) {
    return ResponseEntity.ok(service.get(id));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> create(@Valid @RequestBody ProductoRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody ProductoRequest request) {
    return ResponseEntity.ok(service.update(id, request));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> delete(@PathVariable Long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/ajustar-stock")
  @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
  public ResponseEntity<?> ajustar(@PathVariable Long id, @Valid @RequestBody AjusteStockRequest request, Authentication auth) {
    return ResponseEntity.ok(service.ajustar(id, request, auth));
  }
}
