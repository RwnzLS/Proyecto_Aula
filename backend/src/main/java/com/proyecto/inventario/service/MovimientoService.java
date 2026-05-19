package com.proyecto.inventario.service;

import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.model.TipoMovimiento;
import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MovimientoService {
  private final MovimientoInventarioRepository movimientos;
  private final ZoneId businessZone;

  public MovimientoService(MovimientoInventarioRepository movimientos, @Value("${app.time-zone:America/Bogota}") String businessZone) {
    this.movimientos = movimientos;
    this.businessZone = ZoneId.of(businessZone);
  }

  @Transactional(readOnly = true)
  public Page<MovimientoInventario> list(Long productoId, TipoMovimiento tipoMovimiento, LocalDate fechaDesde, LocalDate fechaHasta, Pageable pageable) {
    Specification<MovimientoInventario> spec = (root, query, cb) -> cb.conjunction();
    if (productoId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("producto").get("id"), productoId));
    if (tipoMovimiento != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("tipoMovimiento"), tipoMovimiento));
    if (fechaDesde != null) {
      spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("fecha"), fechaDesde.atStartOfDay(businessZone).toInstant()));
    }
    if (fechaHasta != null) {
      spec = spec.and((root, query, cb) -> cb.lessThan(root.get("fecha"), fechaHasta.plusDays(1).atStartOfDay(businessZone).toInstant()));
    }
    return movimientos.findAll(spec, defaultSort(pageable));
  }

  private Pageable defaultSort(Pageable pageable) {
    if (pageable.getSort().isSorted()) return pageable;
    return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "fecha"));
  }
}
