package com.proyecto.inventario.security;

import com.proyecto.inventario.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key;
  private final long expirationMillis;

  public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.expiration-minutes}") long minutes) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes());
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
