package com.proyecto.inventario.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.proyecto.inventario.dto.Dtos.SessionResponse;
import com.proyecto.inventario.model.Rol;
import com.proyecto.inventario.security.AuthCookie;
import com.proyecto.inventario.service.AuthService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

class AuthControllerTest {
  /**
   * GET /api/auth/session devuelve los datos del usuario cuya cookie ya valido el
   * JwtAuthFilter. El caso 401 (cookie ausente o expirada) lo cubre Spring Security via
   * {@code anyRequest().authenticated()}, antes de que la peticion llegue al controlador.
   */
  @Test
  void sessionDevuelveLosDatosDelUsuarioDeLaCookie() {
    AuthService authService = mock(AuthService.class);
    AuthController controller = new AuthController(authService, mock(AuthCookie.class));
    UserDetails user = new User("admin@inventario.local", "secret",
      List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    when(authService.currentSession("admin@inventario.local"))
      .thenReturn(new SessionResponse("Admin", "admin@inventario.local", Rol.ADMIN));

    ResponseEntity<SessionResponse> response = controller.session(user);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().nombre()).isEqualTo("Admin");
    assertThat(response.getBody().email()).isEqualTo("admin@inventario.local");
    assertThat(response.getBody().rol()).isEqualTo(Rol.ADMIN);
  }
}
