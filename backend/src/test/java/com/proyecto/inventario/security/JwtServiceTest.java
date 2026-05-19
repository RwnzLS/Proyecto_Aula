package com.proyecto.inventario.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.proyecto.inventario.entity.Usuario;
import com.proyecto.inventario.model.Rol;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
  @Test
  void constructorRechazaSecretCorto() {
    assertThatThrownBy(() -> new JwtService("short-secret", 480))
      .isInstanceOf(IllegalStateException.class)
      .hasMessageContaining("JWT_SECRET");
  }

  @Test
  void constructorRechazaPlaceholderInseguroAnterior() {
    assertThatThrownBy(() -> new JwtService("change-this-secret-key-with-at-least-32-characters", 480))
      .isInstanceOf(IllegalStateException.class)
      .hasMessageContaining("valor por defecto inseguro");
  }

  @Test
  void generaTokenConSecretValido() {
    JwtService service = new JwtService("12345678901234567890123456789012", 480);
    Usuario usuario = new Usuario();
    usuario.setEmail("admin@inventario.local");
    usuario.setRol(Rol.ADMIN);

    String token = service.generate(usuario);

    assertThat(token).isNotBlank();
    assertThat(service.username(token)).isEqualTo("admin@inventario.local");
  }
}
