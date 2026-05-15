# Handoff: Rediseno Visual + UX del Frontend

> **Para Claude (proxima sesion en `claude --dangerously-skip-permissions`)**: este documento es tu contexto inmediato. Leelo completo antes de actuar. La rama, el plan y el estado actual estan aqui — no busques otros docs.

## Quien sos en este proyecto

Estas continuando un rediseno visual + UX del frontend de **Proyecto_Aula** (sistema de inventario, Spring Boot + Angular). El plan ya fue analizado, validado con el usuario y aprobado. Tu trabajo es ejecutar las iteraciones pendientes en orden.

## Estado actual

- **Repo**: `C:\Users\pardo\Documents\Montes\Proyecto_Aula` (NO es la raiz `Montes`).
- **Rama de trabajo**: `rediseno-ui-iterativo` (derivada de `mejoras-inventario-iterativo`).
- **Ultimo commit conocido**: `1127b89 Iteracion 8 - a11y, atajos de teclado, motion y guia de tokens` (mas un commit extra de infra docker, ver abajo).
- **Iteraciones completadas**: 8 de 8.
- **Iteracion en curso**: ninguna. Pendiente QA manual + bug del dashboard + merges (ver "Pendientes" abajo).

Cuando arranques, asegurate de estar en la rama correcta:

```bash
git -C "C:\Users\pardo\Documents\Montes\Proyecto_Aula" status
# debe decir: On branch rediseno-ui-iterativo
git -C "C:\Users\pardo\Documents\Montes\Proyecto_Aula" log --oneline -10
```

Si no, hace checkout: `git -C "C:\Users\pardo\Documents\Montes\Proyecto_Aula" checkout rediseno-ui-iterativo`.

## Pendientes (cerrar antes del merge a main)

### 1. BUG — `/dashboard` crashea en el navegador
- **Sintoma**: al entrar al modulo Dashboard estando logueado como ADMIN, la pagina "se crashea" (reporte verbal del usuario, no se capturo el stack del browser todavia).
- **Lo que ya descarte en la sesion previa**:
  - Build limpio (`npx ng build` sin warnings ni errores).
  - API: `GET /api/dashboard/resumen` responde 200 con JSON valido. Payload visto: `kpis`, `stockTotal=223`, `ventasTotal=0`, `movimientosPorTipo: []`, `topVentas: []`, `productosCriticos: [2 items]`, `actividadReciente: []`.
  - Login OK con `admin@inventario.local / password`, JWT valido.
  - Auth signals (`auth.session()`, `auth.hasRole`) se ven correctos.
  - `ngx-skeleton-loader` esta en `package.json` y compila.
- **Hipotesis a verificar manana**:
  - Posible runtime error en Chart.js cuando `movimientosPorTipo` viene vacio (la doughnut entra al fallback `['Sin movimientos']` con valor `[0]`). Probar con datos reales (registrar un movimiento) para descartar.
  - Posible NPE en alguna celda del data-table; revisar `topSales`, `actividadReciente`, `productosCriticos` cuando alguno trae nulls.
  - `mat-chip` sin `mat-chip-set` (lineas 154 y 187 de `dashboard.component.ts`) podria dar warning silente o crash en Material 17; envolver en `<mat-chip-set>` o usar `<span>` con clase.
- **Primer paso al retomar**: pedir el error de la consola del navegador (`F12` -> Console) y la pestaña Network. Sin eso seguir adivinando es costoso. La sesion previa quedo bloqueada esperando ese dato.

### 2. Merges pendientes (cuando el bug este resuelto y el usuario apruebe visualmente)
- `rediseno-ui-iterativo` -> `mejoras-inventario-iterativo` (rama de ChatGPT).
- `mejoras-inventario-iterativo` -> `main`.
- Borrar ramas locales sobrantes (`git branch -d rediseno-ui-iterativo` y la de ChatGPT) una vez merged.
- Confirmar con el usuario antes de cada paso destructivo (no auto-borrar).

### 3. QA visual end-to-end (item 8 del plan)
Aun no hecho. Cuando el dashboard funcione, repasar las pantallas en claro/oscuro a 360/768/1280/1920 px y validar el checklist al final de este doc.

## Infra local para probar (docker)

Existe `docker-compose.yml` en la raiz del repo. Levanta MySQL 8 en `:3306` con DB poblada desde `db/schema.sql` + `db/data.sql`.

```bash
# en la raiz del repo (Proyecto_Aula/)
docker compose up -d                   # primer arranque tarda en bajar la imagen
docker compose stop                    # apagar sin perder datos (volumen persiste)
docker compose down -v                 # apagar y borrar el volumen (reset de DB)

# backend
cd backend && mvn spring-boot:run      # :8080

# frontend
cd frontend && npx ng serve            # :4200
```

Credenciales sembradas: solo el ADMIN (`admin@inventario.local` / `password`). Los demas roles se crean desde Administracion > Usuarios.

## Restricciones duras (no negociables)

1. **No tocar el backend** (Spring Boot). Cada boton/accion del frontend debe corresponder a un endpoint que ya existe (ver lista mas abajo).
2. **Stack fijo**: Angular 17.3 + Material 17.3 + CDK 17.3 + Chart.js. No actualizar versiones mayores. Permitido sumar libs pequenas y maduras (ej. `ngx-skeleton-loader`); evitar Tailwind/Bootstrap/PrimeNG.
3. **Idioma**: espanol sin tildes en textos visibles, segun convencion de la bitacora de ChatGPT (`docs/bitacora-mejoras-inventario.md`). En codigo y commits tambien.
4. **Sin tests Angular**: el proyecto academico no los requiere.
5. **Sin i18n / PWA / cambios de framework**.
6. **Comportamiento default debe ser idéntico**: cada iteracion debe poder fusionarse sin romper iteraciones previas. Si rompes algo, lo arreglas en la misma iteracion.

## Workflow por iteracion

1. Lee la seccion de la iteracion abajo.
2. Implementa los cambios (puedes usar TodoWrite para trackear las sub-tareas).
3. Corre `npx ng build` desde `frontend/` para verificar que compila sin errores.
4. Si vas a probar visualmente, corre `npx ng serve` y abre `http://localhost:4200`.
5. **Commit con el formato exacto**:
   ```
   Iteracion N - <titulo corto>

   - bullet 1
   - bullet 2
   ...

   Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
   ```
6. Reporta al usuario que terminaste y espera confirmacion para la siguiente iteracion.

**No combinar iteraciones en un solo commit**. Una iteracion = un commit.

## Endpoints disponibles del backend (a respetar, no inventar)

```
POST   /api/auth/login
GET    /api/dashboard
GET    /api/dashboard/resumen
GET    /api/productos                          (filtros: categoria, nombre, stockBajo)
GET    /api/productos/stock-bajo
GET    /api/productos/{id}
POST   /api/productos                          (ADMIN)
PUT    /api/productos/{id}                     (ADMIN)
DELETE /api/productos/{id}                     (ADMIN)
PATCH  /api/productos/{id}/ajustar-stock       (ADMIN, ALMACENISTA)
GET    /api/proveedores                        (ADMIN, GERENTE)
GET    /api/proveedores/{id}
POST   /api/proveedores                        (ADMIN)
PUT    /api/proveedores/{id}                   (ADMIN)
DELETE /api/proveedores/{id}                   (ADMIN)
GET    /api/usuarios                           (ADMIN)
POST   /api/usuarios                           (ADMIN)
PATCH  /api/usuarios/{id}/activo               (ADMIN, query param activo)
POST   /api/entradas                           (ADMIN, ALMACENISTA)
POST   /api/salidas                            (ADMIN, ALMACENISTA)
GET    /api/movimientos                        (filtros: producto, tipo, fecha)
GET    /api/ordenes                            (filtros: estado, proveedor)
GET    /api/ordenes/{id}
POST   /api/ordenes                            (ADMIN, GERENTE)
PUT    /api/ordenes/{id}/enviar                (ADMIN, GERENTE)
POST   /api/ordenes/{id}/recepcion             (ADMIN, ALMACENISTA)
PATCH  /api/ordenes/{id}/cancelar              (ADMIN, GERENTE)
GET    /api/precios/historial
GET    /api/precios/ultimo                     (ADMIN, GERENTE)
POST   /api/precios                            (ADMIN, GERENTE)
```

Roles existentes: `ADMIN`, `GERENTE`, `ALMACENISTA`.

## Decisiones de diseno validadas

- **Navegacion**: migrar `mat-tab-group` a `mat-sidenav` con grupos (Operacion / Compras / Administracion) + drawer en mobile (iteracion 3).
- **Look & feel**: Material refinado (no cambiar a otra UI lib).
- **Granularidad**: 8 iteraciones cortas (~2-3 h c/u), commiteables.
- **Dependencias**: permitido sumar libs pequenas (ej. `ngx-skeleton-loader`).

---

## Iteraciones

### Iteracion 1 — Design tokens + utilidades base [HECHO `bf3029a`]

Tokens, tipografia, a11y y utilidades. Nuevos archivos en `frontend/src/app/styles/`. `styles.scss` refactorizado a `@use` parciales.

### Iteracion 2 — Servicios y componentes shared [SIGUIENTE]

**Objetivo**: piezas reutilizables (toast, confirm, page header, empty state, skeleton) para las pantallas que vienen.

**Cambios concretos**:
- `frontend/src/app/shared/notify.service.ts` — wrapper sobre `MatSnackBar` con `success(msg)`, `info(msg)`, `warning(msg)`, `error(msg)`. `panelClass` por tipo (`notify-success`, etc.), duracion default 3000ms, `verticalPosition: 'top'`. Agregar estilos para esas panelClass en `frontend/src/styles.scss` usando los tokens de color (`--app-success`, `--app-warning`, etc.).
- `frontend/src/app/shared/confirm-dialog.component.ts` — mejorar el existente: prop `variant: 'default' | 'danger'`, boton de confirmar en rojo si danger, `role="alertdialog"`, soporte Enter (confirm) y Esc (cancel) ya provisto por MatDialog pero verificar focus inicial en el boton de cancelar.
- `frontend/src/app/shared/confirm.service.ts` — `confirm({ title, message, confirmLabel?, cancelLabel?, variant? }): Promise<boolean>`. Internamente abre `ConfirmDialogComponent`.
- `frontend/src/app/shared/page-header.component.ts` — standalone, inputs `eyebrow`, `title`, `subtitle`. Slot `<ng-content select="[actions]">` para botones a la derecha. Estructura: usa la clase `.module-hero` que ya existe en styles.scss.
- `frontend/src/app/shared/empty-state.component.ts` — standalone, inputs `icon` (mat-icon name), `title`, `message`. Slot `<ng-content select="[action]">` para CTA opcional.
- `frontend/src/app/shared/skeleton-table.component.ts` — usa `ngx-skeleton-loader`, inputs `rows: number = 5`, `columns: number = 4`.
- Refactor `frontend/src/app/core/interceptors.ts` — el interceptor de errores actual usa `MatSnackBar` directo. Cambiarlo para inyectar `NotifyService` y usarlo. El interceptor distingue 401 vs 403 (no romper esa logica que dejo ChatGPT).

**Instalar**:
```bash
cd frontend && npm install ngx-skeleton-loader
```

**Endpoints involucrados**: ninguno.

**Aceptacion**:
- Build pasa: `npx ng build`.
- Snackbars existentes (login fallido, etc.) siguen apareciendo y ahora tienen color/icono segun tipo.
- Cancelar una orden o eliminar un producto muestra confirm con boton rojo (variant danger). Esto se vera en iteracion 6/7 al usar `confirm.service` desde las pantallas, en esta iteracion solo creas la pieza.
- 5xx muestra toast de error rojo, 401 redirige a login, 403 muestra toast amarillo (warning), no cierra sesion.

**Riesgos**:
- `NotifyService` y `MatSnackBar` directo deben coexistir hasta que migren todas las pantallas. No quites usos directos en iteracion 2; los iremos migrando en las iteraciones de pantallas.
- No tocar la firma actual de `ConfirmDialogComponent` para no romper las llamadas existentes (`open(ConfirmDialogComponent, { data: { title, message } })`). Solo agregar opcional `variant`.

### Iteracion 3 — Shell con sidenav + Router lazy + responsive

**Objetivo**: reemplazar `mat-tab-group` por `mat-sidenav` y migrar a routing real con lazy loading.

**Cambios**:
- Refactor `frontend/src/app/app.routes.ts` — ruta padre `''` con `ShellComponent`, `children` por feature usando `loadComponent`. Rutas: `/dashboard`, `/productos`, `/proveedores`, `/precios`, `/ordenes`, `/movimientos`, `/usuarios`. Aplicar `roleGuard` por ruta (no a nivel shell).
- Refactor `frontend/src/app/features/shell/shell.component.ts` — `mat-sidenav-container` + `mat-sidenav` (mode `side` >=1024px, `over` <1024px). `mat-nav-list` con `routerLink` + `routerLinkActive`. Topbar mantiene brand, theme toggle, sesion, logout. Boton hamburguesa <1024px.
- Sidenav agrupado: **Operacion** (Dashboard, Productos, Movimientos), **Compras** (Proveedores, Precios, Ordenes), **Administracion** (Usuarios). Items filtrados por rol (ALMACENISTA no ve Compras ni Usuarios).
- Migrar todas las llamadas a `WorkspaceNavigationService.go(index)` (especialmente desde `dashboard.component.ts` ~linea 391) a `Router.navigate(['/ordenes'])` etc. Buscar TODOS los usos antes de eliminar el servicio. Si queda inutil, eliminarlo.

**Endpoints**: ninguno.

**Aceptacion**: navegar cambia URL; refresh mantiene la pagina; en mobile sidenav abre/cierra; lazy chunks aparecen en network al primer click; ALMACENISTA no ve secciones prohibidas.

**Riesgos**: dejar quebrada alguna llamada por indice. `grep -rn "WorkspaceNavigationService\|navigation.go" frontend/src` antes de borrar.

### Iteracion 4 — Login rediseñado + tabla generica `app-data-table`

- Refactor `frontend/src/app/features/login/login.component.ts` — badges clickeables por rol que setean credenciales demo; validacion inline ARIA-live; animacion de entrada sutil.
- Crear `frontend/src/app/shared/data-table.component.ts` — wrapper sobre `mat-table`, inputs `columns: TableColumn[]`, `rows`, `loading`, `emptyState`, `paginator`, `(page)`. Sort en cabecera con `mat-sort` client-side dentro de la pagina. Slot `<ng-template #actions let-row>`.
- Reemplazar tablas en `productos.component.ts` y `proveedores.component.ts` por `<app-data-table>`. Skeleton al cargar (`loading=true` muestra `app-skeleton-table`).

### Iteracion 5 — Dashboard rediseñado

- Refactor `dashboard.component.ts`: KPI cards con `metric-icon` por tipo (stock=teal, ventas=blue, ordenes=amber, alertas=red); slot opcional para chip de tendencia (placeholder si backend no lo expone).
- Reemplazar `mat-progress-bar` por `app-skeleton-table` durante carga inicial.
- Doughnut: leyenda lateral con totales. Bar: tooltips formateados con plural ("unidades").
- "Acciones rapidas" como botones tipo card con descripcion y icon.
- Botones que usaban `WorkspaceNavigationService.go(index)` -> `Router.navigate([...])`.
- Tabla "Productos criticos" usa `<app-data-table>` con badge `danger`.

### Iteracion 6 — Productos + Movimientos

- `productos.component.ts`: filtros plegables (`mat-expansion-panel`) en mobile; columna "Stock" con barra de progreso `(stock/min*100)`; chip "Inactivo" si `!activo`; acciones en `mat-menu` overflow en mobile.
- `producto-form-dialog.component.ts`: validacion inline; foco automatico al primer campo; Esc cierra, Enter envia.
- `ajuste-dialog.component.ts`: motivo predefinido (`mat-select`: "Dano", "Conteo fisico", "Devolucion", "Otro"); campo libre solo si "Otro".
- `movimientos.component.ts`: chip por tipo (entrada=success, salida=warn, ajuste=info); date-range filter; export CSV client-side.
- `stock-movement-dialog.component.ts`: `mat-autocomplete` de productos; preview "stock resultante" al escribir cantidad.
- Confirmaciones destructivas usan `confirm.service` variant `danger`.

### Iteracion 7 — Ordenes, Proveedores, Precios, Usuarios

- `ordenes.component.ts`: timeline de estado (BORRADOR -> ENVIADA -> RECIBIDA), badges con icon; expand-row con detalles; acciones por estado en `mat-menu`.
- `orden-form.component.ts`: stepper (Proveedor -> Items -> Confirmar); autocomplete de productos (precio ultimo ya existe); subtotal en vivo. **Mantener payload final igual.**
- `recepcion-dialog.component.ts`: indicador "pendiente / recibido" por linea, validar cantidad <= pendiente.
- `proveedores/*`: empty state ilustrado, validacion inline, badge "Inactivo".
- `precios.component.ts`: filtros como `mat-chip-list` removibles; sparkline mini opcional.
- `usuarios.component.ts`: chips por rol con color; toggle activo confirma con `confirm.service`; generador de password aleatorio en form.

### Iteracion 8 — A11y, motion, atajos y QA visual final [HECHO `1127b89`]

Hecho (commit `1127b89`):
- `KeyboardShortcutsService` + `ShortcutsDialogComponent` (`?`, `/`, `g d/p/m/s/r/o/u`).
- Shell: skip-link, `main#main-content` focuseable, `ariaCurrentWhenActive="page"`, boton de atajos en topbar.
- Motion: filas de tabla a 180ms (`--app-dur-base`).
- `frontend/src/app/styles/README.md` con guia de tokens.

Pendiente del item original:
- Auditoria axe en DevTools — no se hizo, requiere browser.
- QA visual claro/oscuro pantalla por pantalla — no se hizo, requiere browser y bug del dashboard resuelto. Ver "Pendientes" arriba.

---

## Verificacion end-to-end (cuando puedas con backend corriendo)

Backend en `localhost:8080`, frontend `npx ng serve` en `localhost:4200`:
- Login con `admin@inventario.local / password`, recorrer todas las secciones.
- Probar ALMACENISTA: confirmar que no ve Proveedores/Precios/Usuarios.
- Crear producto -> ajustar stock con motivo -> ver movimiento generado.
- Crear orden BORRADOR -> enviar -> recibir parcial -> recibir total.
- Cancelar una orden ENVIADA, validar confirmacion destructiva.
- Toggle tema claro/oscuro: graficas y tablas repintan correctamente.
- Resize 360 / 768 / 1280 / 1920px: sidenav colapsa, tablas con scroll horizontal.
- Tab navigation: focus visible en todo elemento interactivo.

## Comandos utiles

```bash
# desde Proyecto_Aula/frontend/
npx ng build                    # verifica compilacion
npx ng serve                    # dev server en :4200
npm install <pkg>               # instalar dep nueva

# desde cualquier lado, con -C
git -C "C:\Users\pardo\Documents\Montes\Proyecto_Aula" status
git -C "C:\Users\pardo\Documents\Montes\Proyecto_Aula" log --oneline -5
git -C "C:\Users\pardo\Documents\Montes\Proyecto_Aula" diff --stat
```

## Convenciones

- **Espanol sin tildes** en textos visibles y commits (consistencia con bitacora de ChatGPT).
- **Standalone components** en Angular (todos lo son ya).
- **Signals** preferidos sobre RxJS para estado local; RxJS para HTTP.
- **CSS**: usar tokens (`var(--app-*)`) en lugar de valores literales cuando exista el token.
- **No comentarios obvios** en codigo. Solo donde el "por que" no es obvio.
- **Commits**: titulo `Iteracion N - <titulo corto>`, body con bullets, footer `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.

## Si te trabas

- El plan completo y aprobado vive en `~/.claude/plans/necesito-que-analices-la-twinkling-snail.md` (ruta del usuario, en otra maquina puede no existir — este handoff lo replica).
- La bitacora de ChatGPT con el contexto de mejoras previas: `docs/bitacora-mejoras-inventario.md`.
- Si una iteracion implica decisiones que el plan no resuelve, **pregunta al usuario** antes de improvisar (incluso con `--dangerously-skip-permissions` activo, la calidad importa mas que la velocidad).
