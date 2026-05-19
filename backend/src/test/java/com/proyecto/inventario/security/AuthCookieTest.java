package com.proyecto.inventario.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;

class AuthCookieTest {
  @Test
  void usaElAtributoSameSiteConfigurado() {
    AuthCookie cookie = new AuthCookie(true, "None", 480);

    ResponseCookie created = cookie.create("token-valido");

    assertThat(created.getSameSite()).isEqualTo("None");
    assertThat(created.isHttpOnly()).isTrue();
    assertThat(created.isSecure()).isTrue();
    assertThat(created.getName()).isEqualTo(AuthCookie.NAME);
  }

  @Test
  void porDefectoConservaSameSiteStrict() {
    AuthCookie cookie = new AuthCookie(false, "Strict", 480);

    assertThat(cookie.create("token-valido").getSameSite()).isEqualTo("Strict");
  }

  @Test
  void clearGeneraUnaCookieVacia() {
    AuthCookie cookie = new AuthCookie(false, "Strict", 480);

    ResponseCookie cleared = cookie.clear();

    assertThat(cleared.getValue()).isEmpty();
    assertThat(cleared.getMaxAge().isZero()).isTrue();
  }
}
