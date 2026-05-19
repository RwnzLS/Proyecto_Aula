package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.OrdenCompra;
import com.proyecto.inventario.model.EstadoOrden;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, Long>, JpaSpecificationExecutor<OrdenCompra> {
  long countByEstadoIn(Collection<EstadoOrden> estados);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT o FROM OrdenCompra o WHERE o.id = :id")
  Optional<OrdenCompra> findByIdForUpdate(@Param("id") Long id);
}
