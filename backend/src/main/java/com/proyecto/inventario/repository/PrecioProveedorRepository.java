package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.PrecioProveedor;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PrecioProveedorRepository extends JpaRepository<PrecioProveedor, Long>, JpaSpecificationExecutor<PrecioProveedor> {
  @Query("""
    SELECT p FROM PrecioProveedor p
    WHERE p.producto.id = :productoId
      AND p.proveedor.id = :proveedorId
      AND p.producto.activo = true
      AND p.proveedor.activo = true
    ORDER BY p.fechaRegistro DESC
    """)
  List<PrecioProveedor> findUltimosActivos(@Param("productoId") Long productoId, @Param("proveedorId") Long proveedorId, Pageable pageable);
}
