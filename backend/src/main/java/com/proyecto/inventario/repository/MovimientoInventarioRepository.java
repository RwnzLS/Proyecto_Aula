package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.MovimientoInventario;
import com.proyecto.inventario.model.TipoMovimiento;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long>, JpaSpecificationExecutor<MovimientoInventario> {
  Page<MovimientoInventario> findByProductoId(Long productoId, Pageable pageable);

  @Query("SELECT COALESCE(SUM(m.cantidad), 0) FROM MovimientoInventario m WHERE m.tipoMovimiento = :tipo")
  long sumCantidadByTipo(@Param("tipo") TipoMovimiento tipo);

  @Query("SELECT m.tipoMovimiento, COALESCE(SUM(ABS(m.cantidad)), 0) FROM MovimientoInventario m GROUP BY m.tipoMovimiento")
  List<Object[]> sumCantidadAgrupadaPorTipo();

  @Query("""
    SELECT m.producto.id, m.producto.nombre, COALESCE(SUM(m.cantidad), 0)
    FROM MovimientoInventario m
    WHERE m.tipoMovimiento = :tipo
    GROUP BY m.producto.id, m.producto.nombre
    ORDER BY COALESCE(SUM(m.cantidad), 0) DESC
    """)
  List<Object[]> topProductosPorTipo(@Param("tipo") TipoMovimiento tipo, Pageable pageable);

  List<MovimientoInventario> findTop6ByOrderByFechaDesc();
}
