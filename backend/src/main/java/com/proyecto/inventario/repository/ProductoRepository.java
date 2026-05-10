package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface ProductoRepository extends JpaRepository<Producto, Long>, JpaSpecificationExecutor<Producto> {
  long countByActivoTrue();

  @Query("SELECT COUNT(p) FROM Producto p WHERE p.cantidadStock <= p.stockMinimo AND p.activo = true")
  long countStockBajo();
}
