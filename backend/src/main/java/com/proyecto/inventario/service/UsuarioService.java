package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.UsuarioResponse;
import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {
  private final UsuarioRepository usuarios;

  public UsuarioService(UsuarioRepository usuarios) {
    this.usuarios = usuarios;
  }

  @Transactional(readOnly = true)
  public Page<UsuarioResponse> list(Pageable pageable) {
    return usuarios.findAll(pageable).map(this::toResponse);
  }

  @Transactional
  public UsuarioResponse toggleActivo(Long id, boolean activo) {
    Usuario usuario = usuarios.findById(id)
      .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    usuario.setActivo(activo);
    return toResponse(usuarios.save(usuario));
  }

  private UsuarioResponse toResponse(Usuario usuario) {
    return new UsuarioResponse(
      usuario.getId(),
      usuario.getNombre(),
      usuario.getEmail(),
      usuario.getRol(),
      usuario.isActivo(),
      usuario.getFechaCreacion()
    );
  }
}
