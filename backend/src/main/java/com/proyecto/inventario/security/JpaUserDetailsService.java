package com.proyecto.inventario.security;

import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class JpaUserDetailsService implements UserDetailsService {
  private final UsuarioRepository usuarios;

  public JpaUserDetailsService(UsuarioRepository usuarios) {
    this.usuarios = usuarios;
  }

  @Override
  public UserDetails loadUserByUsername(String username) {
    Usuario usuario = usuarios.findByEmail(username)
      .filter(Usuario::isActivo)
      .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    return org.springframework.security.core.userdetails.User.withUsername(usuario.getEmail())
      .password(usuario.getPassword())
      .roles(usuario.getRol().name())
      .build();
  }
}
