package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.PrecioProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PrecioProveedorRepository extends JpaRepository<PrecioProveedor, Long>, JpaSpecificationExecutor<PrecioProveedor> {}
