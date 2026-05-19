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

- [x] #9 / #12 / #18 / #19 - Pendientes de seguridad e inventario.
  - Commit: `ce407a4 fix: completar pendientes de seguridad e inventario`
  - Cambios #12 (JWT en cookie HttpOnly): nuevo `AuthCookie.java` genera cookie `HttpOnly/Secure/SameSite=Strict`; login responde JWT en `Set-Cookie`, logout la limpia; `JwtAuthFilter` lee cookie + fallback Authorization header para Swagger; frontend usa `withCredentials` en `credentialsInterceptor`.
  - Cambios #18 (RUC/NIT obligatorio): `@NotBlank` + `nullable=false` en `Proveedor.rucNit`; migracion `migration-018-ruc-nit-obligatorio.sql`; validacion `required` en formulario frontend.
  - Cambios #19 (listado de inactivos): parametro `activo` en `GET /api/productos`; endpoint `PATCH /{id}/reactivar` (ADMIN); filtro Estado (Activos/Inactivos) y boton Reactivar en frontend.
  - Cambios #9 (notificacion stock bajo en recepcion): `OrdenService.recepcion()` notifica con `productoService.notifyStock()` si tras recepcion el producto queda ≤ stockMinimo.
  - Tests: `JwtAuthFilterTest`, `InventarioServiceTest`, `OrdenServiceTest`.

- [x] #20 - Dashboard no responde por cascada de logout tras 401.
  - Commit: `fix: evitar cascada de logout en dashboard`
  - Cambios: `AuthService.logout()` queda idempotente y el `errorInterceptor` no dispara logout global para `/auth/login` ni `/auth/logout`, evitando recursion si una sesion local queda sin cookie valida o si el backend de logout falla.
  - Verificacion: `npm run build`.

- [x] #21 - Cascada a login por desincronia entre `localStorage` y la cookie HttpOnly.
  - Sintoma reportado: tras el PR #2 (JWT en cookie HttpOnly), casi cualquier accion mostraba
    "Sesion expirada" / "API no disponible" y devolvia al usuario a `/login`.
  - Diagnostico de IAs revisado: culpaban a CORS (`.cors(cors -> {})`, `allowedHeaders`).
    Verificado como **falso positivo** (ver hallazgo #5 ampliado abajo).
  - Causa raiz real: `isLoggedIn` del frontend se derivaba solo de `localStorage`, que
    sobrevive a la expiracion/borrado de la cookie HttpOnly y al reinicio del backend.
    Cuando `localStorage` quedaba sin una cookie viva, el `roleGuard` dejaba entrar, la
    primera llamada respondia 401 y el `errorInterceptor` disparaba el logout en cascada.
  - Cambios backend: nuevo endpoint `GET /api/auth/session` (`AuthController.session()` +
    `AuthService.currentSession()`) que devuelve la sesion si la cookie es valida o 401 si
    no; `AuthCookie` hace el atributo `SameSite` configurable (`app.auth.cookie-same-site`,
    default `Strict`); `SecurityConfig` enlaza el `CorsConfigurationSource` de forma
    explicita (claridad, no era un bug).
  - Cambios frontend: `AuthService.verifySession()` revalida contra `/auth/session` y trata
    `localStorage` solo como pista de arranque; `main.ts` agrega un `APP_INITIALIZER` que
    revalida la sesion antes de levantar el router; `errorInterceptor` deduplica el toast
    "Sesion expirada" y trata `/auth/session` como auth-endpoint.
  - Hardening de configuracion: nuevo `backend/.env.example` y README documentan
    `JWT_SECRET`, `CORS_ORIGINS`, `AUTH_COOKIE_SECURE` y `AUTH_COOKIE_SAME_SITE`.
  - Nota cross-site: con front y back en dominios distintos hay que usar
    `AUTH_COOKIE_SAME_SITE=None` + `AUTH_COOKIE_SECURE=true` (HTTPS), o la cookie no viaja.
  - Tests: `AuthControllerTest`, `AuthCookieTest`, `AuthServiceTest.currentSession...`.
  - Verificacion: `mvn test` y `npm run build`.

## Pendientes reales o decisiones de arquitectura

## Hallazgos verificados como falso positivo o no-bug actual

- [x] #5 - CORS con `.cors(cors -> {})`.
  - Veredicto: falso positivo confirmado (revisado de nuevo al investigar #21).
  - Por que no es bug: `CorsConfigurer` resuelve el `CorsConfigurationSource` buscando un
    bean **llamado `corsConfigurationSource`**; el `@Bean` ya se llama exactamente asi, asi
    que `.cors(cors -> {})` lo autodetecta. La resolucion ocurre al construir la
    `SecurityFilterChain`, despues de registrar todos los beans: no hay race de inicializacion.
  - Ampliar `allowedHeaders` con `Cookie` tampoco aplica: `Cookie` es un *forbidden header
    name*, el navegador nunca lo lista en el preflight `Access-Control-Request-Headers`.
    Angular `HttpClient` tampoco envia `X-Requested-With`.
  - En #21 se cambio `.cors(cors -> {})` por el enlace explicito solo como mejora de
    claridad, no como correccion funcional.
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
