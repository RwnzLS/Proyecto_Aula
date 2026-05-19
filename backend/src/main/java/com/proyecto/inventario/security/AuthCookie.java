package com.proyecto.inventario.security;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Construye la cookie HttpOnly que transporta el JWT. Al no ser legible por JavaScript,
 * un XSS no puede robar el token; SameSite=Strict ademas evita el envio cross-site.
 */
@Component
public class AuthCookie {
  public static final String NAME = "access_token";

  private final boolean secure;
  private final Duration maxAge;

  public AuthCookie(@Value("${app.auth.cookie-secure:false}") boolean secure,
                    @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
    this.secure = secure;
    this.maxAge = Duration.ofMinutes(expirationMinutes);
  }

  public ResponseCookie create(String token) {
    return build(token, maxAge);
  }

  public ResponseCookie clear() {
    return build("", Duration.ZERO);
  }

  private ResponseCookie build(String value, Duration age) {
    return ResponseCookie.from(NAME, value)
      .httpOnly(true)
      .secure(secure)
      .sameSite("Strict")
      .path("/")
      .maxAge(age)
      .build();
  }
}
