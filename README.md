# Sistema de Inventario con Gestion de Proveedores

Monorepo con backend Spring Boot 3, frontend Angular 17, scripts MySQL y documentacion OpenAPI.

## Estructura

- `backend`: API REST con Spring Boot, JPA, Spring Security JWT, JavaMailSender, Thymeleaf y Springdoc.
- `frontend`: SPA Angular standalone con Angular Material, interceptores HTTP, guard por rol y Chart.js.
- `db`: `schema.sql` y `data.sql` para MySQL 8.
- `docs`: notas para exportar OpenAPI.

## Requisitos

- Java 17 o superior.
- Maven 3.9 o superior.
- Node.js 20 o superior.
- MySQL 8.

## Base de datos

```bash
mysql -u root -p < db/schema.sql
mysql -u root -p < db/data.sql
```

Credenciales iniciales:

- Email: `admin@inventario.local`
- Password: `password`

## Variables de entorno backend

```bash
DB_URL=jdbc:mysql://localhost:3306/inventario_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=root
JWT_SECRET=<valor-aleatorio-de-al-menos-32-caracteres>
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=no-reply@inventario.local
OPS_EMAIL=admin@inventario.local
```

`JWT_SECRET` es obligatorio. El backend no arranca si falta, mide menos de 32 caracteres o usa el placeholder inseguro anterior.

## Ejecutar backend

```bash
cd backend
mvn spring-boot:run
```

Swagger UI queda disponible en `http://localhost:8080/swagger-ui.html`.

## Ejecutar frontend

```bash
cd frontend
npm install
npm start
```

La aplicacion queda en `http://localhost:4200`.

La URL del API se configura en `frontend/src/environments/environment.ts`.

## Roles implementados

- `ADMIN`: usuarios, productos, proveedores, precios, ordenes, recepcion, movimientos y dashboard.
- `GERENTE`: consulta productos/proveedores, precios, crear/enviar ordenes, dashboard.
- `ALMACENISTA`: dashboard, consulta productos, entradas, salidas, ajuste de stock, recepcion y movimientos.

## Flujo recomendado de uso

1. Iniciar sesion como `ADMIN`.
2. Crear productos y definir stock minimo.
3. Registrar entradas o salidas desde movimientos.
4. Crear proveedores activos.
5. Registrar precios por proveedor y producto.
6. Crear una orden; al elegir proveedor y producto se sugiere el ultimo precio registrado.
7. Enviar la orden y registrar la recepcion para aumentar stock automaticamente.
8. Revisar movimientos y dashboard para validar trazabilidad.

## Endpoints principales

- `POST /api/auth/login`
- `GET /api/usuarios`
- `POST /api/usuarios`
- `PATCH /api/usuarios/{id}/activo`
- `GET /api/productos`
- `GET /api/productos/stock-bajo`
- `PATCH /api/productos/{id}/ajustar-stock`
- `GET /api/proveedores`
- `GET /api/precios/historial`
- `GET /api/precios/ultimo`
- `POST /api/precios`
- `POST /api/ordenes`
- `PUT /api/ordenes/{id}/enviar`
- `POST /api/ordenes/{id}/recepcion`
- `POST /api/entradas`
- `POST /api/salidas`
- `GET /api/movimientos` con filtros `productoId`, `tipoMovimiento`, `fechaDesde`, `fechaHasta`
- `GET /api/dashboard`
- `GET /api/dashboard/resumen`

## Reglas actuales de inventario

- El stock actual se guarda en `Producto.cantidadStock`.
- Todo cambio operativo de stock debe generar un `MovimientoInventario`.
- La edicion de producto no permite cambiar stock directamente despues de creado.
- Los ajustes usan cantidad con signo: positiva suma, negativa resta.
- Un ajuste no puede ser cero ni dejar el stock en negativo.
- Productos y proveedores inactivos no aparecen en listados operativos ni se usan en operaciones nuevas.
