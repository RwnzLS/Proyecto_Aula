USE inventario_db;

INSERT INTO users (id, nombre, email, password, rol, activo)
VALUES
  (1, 'Administrador', 'admin@inventario.local', '$2a$10$0j07t80jchUi6on2Y7/YX.MYXX71j5izjejqxfUaBU6uXu3ioWM9e', 'ADMIN', TRUE);

INSERT INTO proveedores (id, nombre, ruc_nit, email, telefono, direccion, activo)
VALUES
  (1, 'Suministros Andinos SAS', '900111222-1', 'ventas@suministrosandinos.test', '+57 300 111 2222', 'Calle 10 #20-30', TRUE),
  (2, 'TecnoPartes LTDA', '901333444-5', 'ordenes@tecnopartes.test', '+57 301 333 4444', 'Carrera 7 #45-12', TRUE),
  (3, 'Distribuidora Central', '800555666-7', 'contacto@central.test', '+57 302 555 6666', 'Av. Industrial 100', TRUE);

INSERT INTO productos (id, nombre, descripcion, codigo, categoria, cantidad_stock, stock_minimo, unidad_medida, activo)
VALUES
  (1, 'Tornillo acero M6', 'Tornillo galvanizado para uso general', 'TOR-M6', 'Ferreteria', 120, 50, 'unidad', TRUE),
  (2, 'Cable UTP Cat6', 'Rollo de cable para red categoria 6', 'CAB-CAT6', 'Redes', 8, 10, 'rollo', TRUE),
  (3, 'Guante nitrilo', 'Caja de guantes talla M', 'GUA-NIT-M', 'Seguridad', 30, 20, 'caja', TRUE),
  (4, 'Sensor temperatura', 'Sensor digital industrial', 'SEN-TEMP', 'Electronica', 5, 8, 'unidad', TRUE),
  (5, 'Cinta embalaje', 'Cinta transparente 48mm', 'CIN-48', 'Empaque', 60, 25, 'rollo', TRUE);

INSERT INTO precios_proveedor (proveedor_id, producto_id, precio_unitario, moneda, fecha_registro)
VALUES
  (1, 1, 120.00, 'COP', '2026-01-10 08:00:00'),
  (1, 1, 135.00, 'COP', '2026-04-12 08:00:00'),
  (2, 2, 285000.00, 'COP', '2026-02-05 09:00:00'),
  (2, 4, 42000.00, 'COP', '2026-03-18 10:00:00'),
  (3, 3, 18500.00, 'COP', '2026-01-20 11:00:00'),
  (3, 5, 6800.00, 'COP', '2026-04-01 13:00:00');
