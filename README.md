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
JWT_SECRET=change-this-secret-key-with-at-least-32-characters
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=no-reply@inventario.local
OPS_EMAIL=admin@inventario.local
```

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
- `ALMACENISTA`: consulta productos, ajuste de stock, recepcion y movimientos.

## Endpoints principales

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/productos`
- `GET /api/productos/stock-bajo`
- `PATCH /api/productos/{id}/ajustar-stock`
- `GET /api/proveedores`
- `GET /api/precios/historial`
- `POST /api/precios`
- `POST /api/ordenes`
- `PUT /api/ordenes/{id}/enviar`
- `POST /api/ordenes/{id}/recepcion`
- `GET /api/movimientos`
- `GET /api/dashboard`
