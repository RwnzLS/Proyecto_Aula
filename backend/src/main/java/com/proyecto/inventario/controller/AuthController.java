package com.proyecto.inventario.controller;

import com.proyecto.inventario.dto.Dtos.LoginRequest;
import com.proyecto.inventario.dto.Dtos.LoginResponse;
import com.proyecto.inventario.dto.Dtos.SessionResponse;
import com.proyecto.inventario.security.AuthCookie;
import com.proyecto.inventario.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;
  private final AuthCookie authCookie;

  public AuthController(AuthService authService, AuthCookie authCookie) {
    this.authService = authService;
    this.authCookie = authCookie;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
    LoginResponse login = authService.login(request);
    // El JWT se entrega en una cookie HttpOnly; el cuerpo solo lleva datos de visualizacion.
    return ResponseEntity.ok()
      .header(HttpHeaders.SET_COOKIE, authCookie.create(login.token()).toString())
      .body(new SessionResponse(login.nombre(), login.email(), login.rol()));
  }

  /**
   * Valida la cookie de sesion: responde 200 con los datos del usuario si el JWT es valido,
   * o 401 (via Spring Security) si la cookie expiro, falta o es invalida. El frontend lo usa
   * al arrancar para detectar sesiones de localStorage que ya no tienen una cookie viva.
   */
  @GetMapping("/session")
  public ResponseEntity<SessionResponse> session(@AuthenticationPrincipal UserDetails user) {
    return ResponseEntity.ok(authService.currentSession(user.getUsername()));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout() {
    return ResponseEntity.noContent()
      .header(HttpHeaders.SET_COOKIE, authCookie.clear().toString())
      .build();
  }
}
