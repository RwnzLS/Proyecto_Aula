package com.proyecto.inventario.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.proyecto.inventario.dto.Dtos.SessionResponse;
import com.proyecto.inventario.dto.Dtos.UserRequest;
import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.model.Rol;
import com.proyecto.inventario.repository.UsuarioRepository;
import com.proyecto.inventario.security.JwtService;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {
  @Test
  void createNoIncluyePasswordEnEmailDeBienvenida() {
    UsuarioRepository usuarios = mock(UsuarioRepository.class);
    PasswordEncoder encoder = mock(PasswordEncoder.class);
    EmailService email = mock(EmailService.class);
    AuthService service = new AuthService(
      usuarios,
      encoder,
      mock(JwtService.class),
      mock(AuthenticationManager.class),
      email
    );
    when(encoder.encode("Temporal123")).thenReturn("hash");
    when(usuarios.save(org.mockito.ArgumentMatchers.any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

    service.create(new UserRequest("Admin", "admin@inventario.local", "Temporal123", Rol.ADMIN, true));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<Map<String, Object>> vars = ArgumentCaptor.forClass(Map.class);
    verify(email).sendTemplate(eq("admin@inventario.local"), eq("Bienvenido al sistema"), eq("bienvenida"), vars.capture());
    assertThat(vars.getValue()).containsEntry("nombre", "Admin");
    assertThat(vars.getValue()).containsEntry("email", "admin@inventario.local");
    assertThat(vars.getValue()).doesNotContainKey("passwordTemporal");
    assertThat(vars.getValue()).doesNotContainValue("Temporal123");
  }

  @Test
  void currentSessionDevuelveLosDatosDelUsuarioAutenticado() {
    UsuarioRepository usuarios = mock(UsuarioRepository.class);
    AuthService service = new AuthService(
      usuarios,
      mock(PasswordEncoder.class),
      mock(JwtService.class),
      mock(AuthenticationManager.class),
      mock(EmailService.class)
    );
    Usuario usuario = new Usuario();
    usuario.setNombre("Admin");
    usuario.setEmail("admin@inventario.local");
    usuario.setRol(Rol.ADMIN);
    when(usuarios.findByEmail("admin@inventario.local")).thenReturn(Optional.of(usuario));

    SessionResponse session = service.currentSession("admin@inventario.local");

    assertThat(session.nombre()).isEqualTo("Admin");
    assertThat(session.email()).isEqualTo("admin@inventario.local");
    assertThat(session.rol()).isEqualTo(Rol.ADMIN);
  }
}
