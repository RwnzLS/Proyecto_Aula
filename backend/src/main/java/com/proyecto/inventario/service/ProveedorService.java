package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.ProveedorRequest;
import com.proyecto.inventario.entity.Proveedor;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.repository.ProveedorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProveedorService {
  private final ProveedorRepository proveedores;

  public ProveedorService(ProveedorRepository proveedores) {
    this.proveedores = proveedores;
  }

  @Transactional(readOnly = true)
  public Page<Proveedor> list(String nombre, Pageable pageable) {
    Specification<Proveedor> spec = (root, query, cb) -> cb.isTrue(root.get("activo"));
    if (nombre != null && !nombre.isBlank()) {
      spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("nombre")), "%" + nombre.toLowerCase() + "%"));
    }
    return proveedores.findAll(spec, pageable);
  }

  @Transactional(readOnly = true)
  public Proveedor get(Long id) {
    return proveedores.findById(id).orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));
  }

  @Transactional
  public Proveedor save(ProveedorRequest request, Long id) {
    Proveedor proveedor = id == null ? new Proveedor() : get(id);
    proveedor.setNombre(request.nombre());
    proveedor.setRucNit(request.rucNit());
    proveedor.setEmail(request.email());
    proveedor.setTelefono(request.telefono());
    proveedor.setDireccion(request.direccion());
    proveedor.setActivo(request.activo() == null || request.activo());
    return proveedores.save(proveedor);
  }

  @Transactional
  public void delete(Long id) {
    Proveedor proveedor = get(id);
    proveedor.setActivo(false);
    proveedores.save(proveedor);
  }
}
