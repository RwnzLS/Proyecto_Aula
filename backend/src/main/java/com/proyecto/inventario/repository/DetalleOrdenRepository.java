package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.DetalleOrden;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetalleOrdenRepository extends JpaRepository<DetalleOrden, Long> {}
