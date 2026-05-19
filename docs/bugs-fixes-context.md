# Bugs y fixes - contexto para agentes IA

Este archivo es la bitacora viva de bugs/fixes del analisis de seguridad e inventario.
Cada fix implementado debe quedar marcado con `[x]`, con commit y una nota breve.
Si un hallazgo se verifica como falso positivo o requiere decision de producto, tambien debe quedar documentado para evitar trabajo duplicado.

## Rama de trabajo

- Rama local/remota: `fix/bugs-inventario-iteraciones`
- Upstream: `origin/fix/bugs-inventario-iteraciones`
- Base inicial: `main` en `d3f2a4a`

## Fixes ya implementados

- [x] #1 / #15 - No enviar contrasena en texto plano por email.
  - Commit: `74b9f2d fix: endurecer configuracion de autenticacion`
  - Cambios: `AuthService.create()` ya no envia `passwordTemporal`; `bienvenida.html` informa que la clave no se incluye por seguridad.
  - Tests: `AuthServiceTest.createNoIncluyePasswordEnEmailDeBienvenida`.

- [x] #2 - No exponer mensajes internos en errores genericos.
  - Commit: `74b9f2d fix: endurecer configuracion de autenticacion`
  - Cambios: `GlobalExceptionHandler.generic()` registra el error en logs y responde un mensaje generico.
  - Tests: `GlobalExceptionHandlerTest.genericNoExponeMensajeInternoAlCliente`.

- [x] #3 - Evitar JWT secret por defecto/debil.
  - Commit: `74b9f2d fix: endurecer configuracion de autenticacion`
  - Cambios: `JWT_SECRET` queda sin default inseguro en `application.yml`; `JwtService` rechaza secretos menores a 32 caracteres o el placeholder anterior.
  - Tests: `JwtServiceTest`.
  - Nota operativa: configurar `JWT_SECRET` antes de arrancar backend.

- [x] #4 / #7 / #13 - Race condition en recepcion/cancelacion/envio de ordenes.
  - Commit: `2c5bf8a fix: serializar cambios de ordenes`
  - Cambios: `OrdenCompraRepository.findByIdForUpdate()` usa `PESSIMISTIC_WRITE`; `OrdenService.enviar()`, `recepcion()` y `cancelar()` cargan la orden con lock.
  - Tests: `OrdenServiceTest` verifica que los caminos de estado usan `findByIdForUpdate`.

- [x] #6 - Agregar transacciones a escrituras faltantes.
  - Commit: `894dd9d fix: agregar transacciones en escrituras`
  - Cambios: `ProductoService.create/update/delete`, `ProveedorService.save/delete`, `PrecioService.create`.
  - Nota: `AuthService.create()` se cubrio en `74b9f2d`; `AuthService.login()` no se marco como bug porque no escribe estado.

- [x] #17 - `ProductoService.update()` no debe cambiar `activo`.
  - Commit: `8edab40 fix: conservar estado activo al editar productos`
  - Cambios: `copyBase()` ya no modifica `activo`; solo `copyCreate()` lo inicializa.
  - Tests: `InventarioServiceTest.actualizarProductoNoCambiaActivoCuandoVieneNulo` y `actualizarProductoIgnoraActivoDelRequest`.

- [x] #14 - Evitar `unknown` en payload de creacion de ordenes del frontend.
  - Commit: `55be35f fix: tipar payload de creacion de ordenes`
  - Cambios: agrega `OrdenRequest`, `DetalleOrdenRequest` y `RecepcionItemRequest` en `models.ts`; `ApiService.crearOrden()` y `recibirOrden()` usan esos tipos.
  - Verificacion: `npm run build`.

- [x] #8 - Filtro de fechas no debe usar UTC hardcodeado.
  - Commit: `dd7eaab fix: usar zona horaria configurable en movimientos`
  - Cambios: `MovimientoService` usa `app.time-zone`; default `America/Bogota`; README documenta `APP_TIME_ZONE`.
  - Verificacion: `mvn test`.

## Pendientes reales o decisiones de arquitectura

- [ ] #12 - JWT en `localStorage`.
  - Riesgo: XSS puede leer el token.
  - Siguiente paso sugerido: cambiar backend/frontend a cookie `HttpOnly`, `Secure`, `SameSite`; ajustar login/logout, interceptor y `JwtAuthFilter`.
  - Importante: esto es cambio de arquitectura auth; no mezclar con fixes pequenos.

- [ ] #18 - `Proveedor.rucNit` es `UNIQUE` pero nullable.
  - Decision requerida: si RUC/NIT debe ser obligatorio, agregar `@NotBlank`, `nullable = false` y migracion/schema.
  - Si el negocio permite proveedores sin RUC/NIT, no es bug.

- [ ] #19 - No hay listado principal de productos inactivos.
  - Decision requerida: si admin debe ver/reactivar inactivos, agregar filtro `activo` o endpoint administrativo.
  - Esto es mejora funcional, no bug de seguridad.

- [ ] #9 - Notificacion de stock bajo durante recepcion.
  - Decision requerida: recibir mercancia aumenta stock; solo tiene sentido notificar si el producto sigue bajo minimo tras recepcion y el negocio quiere ese aviso.

## Hallazgos verificados como falso positivo o no-bug actual

- [x] #5 - CORS con `.cors(cors -> {})`.
  - Veredicto: falso positivo funcional. Spring Security puede autodetectar el bean `CorsConfigurationSource`.
  - Riesgo residual: si en produccion se configura wildcard con credenciales, revisar `CORS_ORIGINS`.

- [x] #10 - `sumCantidadByTipo()` con ajustes negativos.
  - Veredicto: no es bug actual. Hoy se usa para `TipoMovimiento.SALIDA`; el resumen agrupado ya usa `ABS`.
  - Posible hardening futuro: separar metodos para cantidades absolutas vs netas.

- [x] #11 - Sin limite de paginacion.
  - Veredicto: falso positivo en la parte de OOM ilimitado. Spring Data Commons 3.3.5 tiene `maxPageSize` default 2000.
  - Posible hardening futuro: configurar un limite menor explicito.

- [x] #16 - Handlers de excepcion package-private.
  - Veredicto: no era bug funcional. En `74b9f2d` quedaron `public` como mejora de claridad.

## Verificaciones ejecutadas

- [x] Backend: `mvn test`
  - Ultimo resultado observado: 24 tests, 0 failures, 0 errors.

- [x] Frontend: `npm run build`
  - Resultado observado: build completo correctamente.

## Archivos locales ignorados durante los fixes

Estos archivos estaban no trackeados y no forman parte de los commits de fixes:

- `backend/backend.err`
- `frontend/frontend.err`
- `package-lock.json` en la raiz del repo

## Regla para proximos agentes

1. Antes de trabajar, leer este archivo y `git log --oneline -8`.
2. Si se implementa un fix, marcar su item con `[x]`, agregar commit y verificacion.
3. Si aparece un bug nuevo, agregarlo en "Pendientes reales o decisiones de arquitectura" con `[ ]`.
4. No modificar ni borrar los archivos no trackeados listados arriba salvo instruccion explicita del usuario.
