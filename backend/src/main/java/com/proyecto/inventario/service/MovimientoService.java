package com.proyecto.inventario.service;

import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.repository.MovimientoInventarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MovimientoService {
  private final MovimientoInventarioRepository movimientos;

  public MovimientoService(MovimientoInventarioRepository movimientos) {
    this.movimientos = movimientos;
  }

  @Transactional(readOnly = true)
  public Page<MovimientoInventario> list(Long productoId, Pageable pageable) {
    if (productoId != null) {
      return movimientos.findByProductoId(productoId, pageable);
    }
    return movimientos.findAll(pageable);
  }
}
