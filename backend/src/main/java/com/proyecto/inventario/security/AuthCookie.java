package com.proyecto.inventario.security;

import java.time.Duration;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Construye la cookie HttpOnly que transporta el JWT. Al no ser legible por JavaScript,
 * un XSS no puede robar el token. El atributo SameSite es configurable:
 * <ul>
 *   <li>{@code Strict}/{@code Lax}: validos cuando frontend y backend comparten sitio
 *       (p. ej. localhost:4200 y localhost:8080 en desarrollo).</li>
 *   <li>{@code None}: obligatorio si se despliegan en dominios distintos; requiere
 *       ademas {@code app.auth.cookie-secure=true} (HTTPS), o el navegador la rechaza.</li>
 * </ul>
 */
@Component
public class AuthCookie {
  public static final String NAME = "access_token";

  private final boolean secure;
  private final String sameSite;
  private final Duration maxAge;

  public AuthCookie(@Value("${app.auth.cookie-secure:false}") boolean secure,
                    @Value("${app.auth.cookie-same-site:Strict}") String sameSite,
                    @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
    this.secure = secure;
    this.sameSite = Objects.requireNonNull(sameSite, "sameSite");
    this.maxAge = Duration.ofMinutes(expirationMinutes);
  }

  public ResponseCookie create(String token) {
    return build(Objects.requireNonNull(token, "token"), maxAge);
  }

  public ResponseCookie clear() {
    return build("", Duration.ZERO);
  }

  private ResponseCookie build(String value, Duration age) {
    return ResponseCookie.from(NAME, Objects.requireNonNull(value, "value"))
      .httpOnly(true)
      .secure(secure)
      .sameSite(sameSite)
      .path("/")
      .maxAge(Objects.requireNonNull(age, "age"))
      .build();
  }
}
