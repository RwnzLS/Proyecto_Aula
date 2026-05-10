USE inventario_db;

INSERT INTO users (nombre, email, password, rol, activo)
VALUES (
  'Administrador',
  'admin@inventario.local',
  '$2a$10$0j07t80jchUi6on2Y7/YX.MYXX71j5izjejqxfUaBU6uXu3ioWM9e',
  'ADMIN',
  TRUE
)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  password = VALUES(password),
  rol = VALUES(rol),
  activo = VALUES(activo);
