package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.Producto;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductoRepository extends JpaRepository<Producto, Long>, JpaSpecificationExecutor<Producto> {
  long countByActivoTrue();

  @Query("SELECT COUNT(p) FROM Producto p WHERE p.cantidadStock <= p.stockMinimo AND p.activo = true")
  long countStockBajo();

  @Query("SELECT COALESCE(SUM(p.cantidadStock), 0) FROM Producto p WHERE p.activo = true")
  long sumStockActivo();

  @Query("SELECT p FROM Producto p WHERE p.cantidadStock <= p.stockMinimo AND p.activo = true ORDER BY p.cantidadStock ASC, p.nombre ASC")
  List<Producto> findStockBajoActivos(Pageable pageable);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT p FROM Producto p WHERE p.id = :id")
  Optional<Producto> findByIdForUpdate(@Param("id") Long id);
}
