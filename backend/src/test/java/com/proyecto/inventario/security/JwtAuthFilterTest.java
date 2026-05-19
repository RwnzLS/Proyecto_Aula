package com.proyecto.inventario.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

class JwtAuthFilterTest {
  private JwtService jwtService;
  private UserDetailsService userDetailsService;
  private JwtAuthFilter filter;

  @BeforeEach
  void setUp() {
    jwtService = mock(JwtService.class);
    userDetailsService = mock(UserDetailsService.class);
    filter = new JwtAuthFilter(jwtService, userDetailsService);
    SecurityContextHolder.clearContext();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void autenticaCuandoElTokenViajaEnLaCookieHttpOnly() throws Exception {
    UserDetails user = new User("admin@inventario.local", "secret",
      List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    when(jwtService.username("token-valido")).thenReturn("admin@inventario.local");
    when(userDetailsService.loadUserByUsername("admin@inventario.local")).thenReturn(user);
    when(jwtService.valid("token-valido", user)).thenReturn(true);

    HttpServletRequest request = mock(HttpServletRequest.class);
    when(request.getCookies()).thenReturn(new Cookie[] { new Cookie(AuthCookie.NAME, "token-valido") });
    HttpServletResponse response = mock(HttpServletResponse.class);
    FilterChain chain = mock(FilterChain.class);

    filter.doFilterInternal(request, response, chain);

    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("admin@inventario.local");
    verify(chain).doFilter(request, response);
  }

  @Test
  void noAutenticaCuandoNoHayCookieNiHeader() throws Exception {
    HttpServletRequest request = mock(HttpServletRequest.class);
    when(request.getCookies()).thenReturn(null);
    when(request.getHeader("Authorization")).thenReturn(null);
    HttpServletResponse response = mock(HttpServletResponse.class);
    FilterChain chain = mock(FilterChain.class);

    filter.doFilterInternal(request, response, chain);

    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    verify(chain).doFilter(request, response);
  }
}
