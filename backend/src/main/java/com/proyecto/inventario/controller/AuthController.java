package com.proyecto.inventario.controller;

import com.proyecto.inventario.dto.Dtos.LoginRequest;
import com.proyecto.inventario.dto.Dtos.LoginResponse;
import com.proyecto.inventario.dto.Dtos.SessionResponse;
import com.proyecto.inventario.security.AuthCookie;
import com.proyecto.inventario.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
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

  @PostMapping("/logout")
  public ResponseEntity<?> logout() {
    return ResponseEntity.noContent()
      .header(HttpHeaders.SET_COOKIE, authCookie.clear().toString())
      .build();
  }
}
