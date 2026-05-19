package com.proyecto.inventario.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.proyecto.inventario.dto.Dtos.ApiError;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {
  @Test
  void genericNoExponeMensajeInternoAlCliente() {
    GlobalExceptionHandler handler = new GlobalExceptionHandler();

    ResponseEntity<?> response = handler.generic(new RuntimeException("SQL syntax error near users.password"));

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    assertThat(response.getBody()).isInstanceOf(ApiError.class);
    ApiError body = (ApiError) response.getBody();
    assertThat(body.code()).isEqualTo("INTERNAL_ERROR");
    assertThat(body.message()).isEqualTo("Ocurrio un error interno");
    assertThat(body.message()).doesNotContain("SQL").doesNotContain("password");
  }
}
