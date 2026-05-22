package com.proyecto.inventario.exception;

import com.proyecto.inventario.dto.Dtos.ApiError;
import java.time.Instant;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<?> notFound(NotFoundException ex) {
    return error(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
  }

  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<?> business(BusinessException ex) {
    return error(HttpStatus.BAD_REQUEST, "BUSINESS_ERROR", ex.getMessage());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<?> validation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
      .map(e -> e.getField() + ": " + e.getDefaultMessage())
      .collect(Collectors.joining(", "));
    return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> generic(Exception ex) {
    log.error("Unhandled exception", ex);
    return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Ocurrio un error interno");
  }

  private ResponseEntity<?> error(HttpStatus status, String code, String message) {
    return ResponseEntity.status(status.value()).body(new ApiError(code, message, Instant.now()));
  }
}
