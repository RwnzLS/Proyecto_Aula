package com.proyecto.inventario.service;

import com.proyecto.inventario.dto.Dtos.LoginRequest;
import com.proyecto.inventario.dto.Dtos.LoginResponse;
import com.proyecto.inventario.dto.Dtos.SessionResponse;
import com.proyecto.inventario.dto.Dtos.UserRequest;
import com.proyecto.inventario.dto.Dtos.UsuarioResponse;
import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.exception.NotFoundException;
import com.proyecto.inventario.repository.UsuarioRepository;
import com.proyecto.inventario.security.JwtService;
import java.util.Map;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UsuarioRepository usuarios;
  private final PasswordEncoder encoder;
  private final JwtService jwt;
  private final AuthenticationManager auth;
  private final EmailService email;

  public AuthService(UsuarioRepository usuarios, PasswordEncoder encoder, JwtService jwt, AuthenticationManager auth, EmailService email) {
    this.usuarios = usuarios;
    this.encoder = encoder;
    this.jwt = jwt;
    this.auth = auth;
    this.email = email;
  }

  public LoginResponse login(LoginRequest request) {
    auth.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
    Usuario usuario = usuarios.findByEmail(request.email()).orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    return new LoginResponse(jwt.generate(usuario), usuario.getNombre(), usuario.getEmail(), usuario.getRol());
  }

  /**
   * Devuelve los datos de la sesion del usuario autenticado por la cookie. Permite que el
   * frontend revalide contra el backend en lugar de confiar ciegamente en localStorage.
   */
  public SessionResponse currentSession(String email) {
    Usuario usuario = usuarios.findByEmail(email).orElseThrow();
    return new SessionResponse(usuario.getNombre(), usuario.getEmail(), usuario.getRol());
  }

  @Transactional
  public UsuarioResponse create(UserRequest request) {
    Usuario usuario = new Usuario();
    usuario.setNombre(request.nombre());
    usuario.setEmail(request.email());
    usuario.setPassword(encoder.encode(request.password()));
    usuario.setRol(request.rol());
    usuario.setActivo(request.activo() == null || request.activo());
    Usuario saved = usuarios.save(usuario);
    email.sendTemplate(saved.getEmail(), "Bienvenido al sistema", "bienvenida",
      Map.of("nombre", saved.getNombre(), "email", saved.getEmail()));
    return toResponse(saved);
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
