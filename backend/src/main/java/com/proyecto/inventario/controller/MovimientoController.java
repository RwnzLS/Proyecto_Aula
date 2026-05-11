package com.proyecto.inventario.controller;

import com.proyecto.inventario.service.MovimientoService;
import com.proyecto.inventario.model.TipoMovimiento;
import java.time.LocalDate;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
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
  public ResponseEntity<?> list(@RequestParam(required = false) Long productoId,
                                @RequestParam(required = false) TipoMovimiento tipoMovimiento,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
                                Pageable pageable) {
    return ResponseEntity.ok(service.list(productoId, tipoMovimiento, fechaDesde, fechaHasta, pageable));
  }
}
