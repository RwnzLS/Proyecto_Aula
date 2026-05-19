-- Migracion hallazgo #18: el RUC/NIT del proveedor pasa a ser obligatorio.
-- El backend usa spring.jpa.hibernate.ddl-auto=validate, por lo que esta migracion
-- debe aplicarse sobre bases existentes ANTES de desplegar el backend actualizado.
USE inventario_db;

-- Paso 1: detectar proveedores sin RUC/NIT (deben corregirse antes del paso 2).
--   SELECT id, nombre FROM proveedores WHERE ruc_nit IS NULL OR ruc_nit = '';

-- Paso 2: una vez completados esos registros, aplicar la restriccion NOT NULL.
ALTER TABLE proveedores MODIFY ruc_nit VARCHAR(80) NOT NULL;
