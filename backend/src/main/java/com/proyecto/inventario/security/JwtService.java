package com.proyecto.inventario.security;

import com.proyecto.inventario.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private static final int MIN_SECRET_LENGTH = 32;
  private static final String DEFAULT_SECRET_PLACEHOLDER = "change-this-secret-key-with-at-least-32-characters";
  private final SecretKey key;
  private final long expirationMillis;

  public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.expiration-minutes}") long minutes) {
    String normalizedSecret = secret == null ? "" : secret.trim();
    if (normalizedSecret.length() < MIN_SECRET_LENGTH || DEFAULT_SECRET_PLACEHOLDER.equals(normalizedSecret)) {
      throw new IllegalStateException("JWT_SECRET debe configurarse con al menos 32 caracteres y no puede usar el valor por defecto inseguro");
    }
    this.key = Keys.hmacShaKeyFor(normalizedSecret.getBytes(StandardCharsets.UTF_8));
    this.expirationMillis = minutes * 60_000;
  }

  public String generate(Usuario usuario) {
    Instant now = Instant.now();
    return Jwts.builder()
      .subject(usuario.getEmail())
      .claim("rol", usuario.getRol().name())
      .issuedAt(Date.from(now))
      .expiration(Date.from(now.plusMillis(expirationMillis)))
      .signWith(key)
      .compact();
  }

  public String username(String token) {
    return claims(token).getSubject();
  }

  public boolean valid(String token, UserDetails user) {
    return username(token).equals(user.getUsername()) && claims(token).getExpiration().after(new Date());
  }

  private Claims claims(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }
}
