package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.OrdenCompra;
import com.proyecto.inventario.model.EstadoOrden;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, Long>, JpaSpecificationExecutor<OrdenCompra> {
  long countByEstadoIn(Collection<EstadoOrden> estados);
}
