CREATE DATABASE IF NOT EXISTS inventario_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'inventario'@'localhost' IDENTIFIED BY 'inventario123';
GRANT ALL PRIVILEGES ON inventario_db.* TO 'inventario'@'localhost';
FLUSH PRIVILEGES;
USE inventario_db;

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(30) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_rol CHECK (rol IN ('ADMIN','ALMACENISTA','GERENTE'))
);

CREATE TABLE productos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(160) NOT NULL,
  descripcion VARCHAR(500),
  codigo VARCHAR(80) NOT NULL UNIQUE,
  categoria VARCHAR(120),
  cantidad_stock INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  unidad_medida VARCHAR(40),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_producto_stock CHECK (cantidad_stock >= 0),
  CONSTRAINT chk_producto_minimo CHECK (stock_minimo >= 0),
  INDEX idx_producto_nombre (nombre),
  INDEX idx_producto_categoria (categoria)
);

CREATE TABLE proveedores (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(160) NOT NULL,
  ruc_nit VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(160),
  telefono VARCHAR(60),
  direccion VARCHAR(255),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_proveedor_nombre (nombre)
);

CREATE TABLE precios_proveedor (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  proveedor_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL,
  precio_unitario DECIMAL(14,2) NOT NULL,
  moneda VARCHAR(10) NOT NULL DEFAULT 'COP',
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_precio_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  CONSTRAINT fk_precio_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT chk_precio_valor CHECK (precio_unitario >= 0),
  INDEX idx_precio_proveedor (proveedor_id),
  INDEX idx_precio_producto (producto_id),
  INDEX idx_precio_fecha (fecha_registro)
);

CREATE TABLE ordenes_compra (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  proveedor_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_esperada DATE,
  estado VARCHAR(40) NOT NULL DEFAULT 'BORRADOR',
  observaciones VARCHAR(500),
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_orden_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  CONSTRAINT fk_orden_usuario FOREIGN KEY (usuario_id) REFERENCES users(id),
  CONSTRAINT chk_orden_estado CHECK (estado IN ('BORRADOR','ENVIADA','RECIBIDA_PARCIAL','RECIBIDA','CANCELADA')),
  INDEX idx_orden_estado (estado),
  INDEX idx_orden_proveedor (proveedor_id)
);

CREATE TABLE detalles_orden (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  orden_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL,
  cantidad_solicitada INT NOT NULL,
  cantidad_recibida INT NOT NULL DEFAULT 0,
  precio_unitario DECIMAL(14,2) NOT NULL,
  CONSTRAINT fk_detalle_orden FOREIGN KEY (orden_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT chk_detalle_solicitada CHECK (cantidad_solicitada > 0),
  CONSTRAINT chk_detalle_recibida CHECK (cantidad_recibida >= 0 AND cantidad_recibida <= cantidad_solicitada),
  CONSTRAINT chk_detalle_precio CHECK (precio_unitario >= 0),
  INDEX idx_detalle_orden (orden_id),
  INDEX idx_detalle_producto (producto_id)
);

CREATE TABLE movimientos_inventario (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  producto_id BIGINT NOT NULL,
  tipo_movimiento VARCHAR(30) NOT NULL,
  cantidad INT NOT NULL,
  usuario_responsable_id BIGINT NOT NULL,
  referencia VARCHAR(120),
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_responsable_id) REFERENCES users(id),
  CONSTRAINT chk_mov_tipo CHECK (tipo_movimiento IN ('ENTRADA','SALIDA','AJUSTE')),
  INDEX idx_mov_producto (producto_id),
  INDEX idx_mov_fecha (fecha),
  INDEX idx_mov_tipo_fecha (tipo_movimiento, fecha),
  INDEX idx_mov_producto_fecha (producto_id, fecha)
);
