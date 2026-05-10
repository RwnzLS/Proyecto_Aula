package com.proyecto.inventario.repository;

import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.model.Rol;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
  Optional<Usuario> findByEmail(String email);
  List<Usuario> findByRolInAndActivoTrue(Collection<Rol> roles);
}
