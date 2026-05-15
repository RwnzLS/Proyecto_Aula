# Bitacora De Mejoras De Inventario

## Objetivo
Explicar que problemas se corrigieron, por que se corrigieron y como quedo conectado el flujo de inventario. Esta bitacora queda como contexto rapido para futuras conversaciones y para entender las decisiones del proyecto.

## Rama De Trabajo
- Rama: `mejoras-inventario-iterativo`
- Motivo: aislar todos los cambios de inventario, pruebas y documentacion sin tocar directamente `main`.

## Cambios Realizados
| Iteracion | Cambio | Motivo | Archivos principales | Pruebas |
|---|---|---|---|---|
| 1 | Ajustes de stock validados: no se permite cantidad cero ni dejar stock negativo. | Evitar que el stock real y el historial se contradigan. | `ProductoService`, `AjusteDialogComponent`, `InventarioServiceTest` | `mvn test`, `npm run build` |
| 1 | La edicion de producto ya no puede cambiar stock directamente despues de creado. | Todo cambio operativo debe pasar por movimiento auditable. | `ProductoService`, `ProductoFormDialogComponent` | `mvn test`, `npm run build` |
| 2 | Productos y proveedores se listan activos por defecto. | La baja logica no debe dejar registros inactivos en flujos operativos. | `ProductoService`, `ProveedorService` | `mvn test` |
| 2 | Movimientos, precios y ordenes rechazan productos/proveedores inactivos. | Evitar operaciones nuevas con catalogos desactivados. | `StockMovimientoService`, `PrecioService`, `OrdenService` | `InventarioServiceTest`, `PrecioServiceTest`, `OrdenServiceTest` |
| 3 | La navegacion oculta proveedores y precios para `ALMACENISTA`. | Evitar llamadas a endpoints que ese rol no puede usar. | `ShellComponent` | `npm run build` |
| 3 | El interceptor diferencia `401` y `403`. | Un error de permisos no debe cerrar sesion. | `interceptors.ts` | `npm run build` |
| 4 | Se agrego `GET /api/precios/ultimo`. | Permitir que las ordenes usen el ultimo precio historico como sugerencia. | `PrecioController`, `PrecioService`, `PrecioProveedorRepository` | `PrecioServiceTest`, `mvn test` |
| 4 | El formulario de orden autocompleta precio por proveedor/producto. | Conectar precios con compras sin alterar el snapshot guardado en la orden. | `OrdenFormComponent`, `ApiService` | `npm run build` |
| 5 | Se agrego `GET /api/dashboard/resumen` con metricas agregadas desde backend. | Evitar que el dashboard calcule datos con solo los primeros registros paginados. | `DashboardController`, `DashboardService`, `MovimientoInventarioRepository`, `ProductoRepository` | `mvn test`, `npm run build` |
| 5 | El dashboard Angular consume el resumen backend. | Mostrar stock, ventas, top ventas, criticos y actividad con datos consistentes. | `DashboardComponent`, `models.ts`, `ApiService` | `npm run build` |
| 6 | README y Postman actualizados. | Alinear documentacion con endpoints reales. | `README.md`, `docs/postman_collection.json` | Revision estatica |

## Decisiones Tecnicas
- El stock actual vive en `Producto.cantidadStock`.
- La auditoria vive en `MovimientoInventario`.
- Todo cambio operativo de stock debe generar movimiento.
- `Producto.cantidadStock` se puede cargar al crear producto, pero no cambiar silenciosamente al editarlo.
- Los ajustes usan cantidad con signo: positiva suma, negativa resta.
- Productos/proveedores inactivos no se usan en operaciones nuevas.
- Las ordenes guardan `precioUnitario` como snapshot; cambios futuros del historial de precios no modifican ordenes antiguas.
- El dashboard usa metricas agregadas desde backend para no depender de paginas parciales cargadas en Angular.

## Flujo Actual Del Inventario
1. Productos definen stock actual, stock minimo y estado activo.
2. Entradas suman stock y crean movimiento `ENTRADA`.
3. Salidas restan stock, validan disponibilidad y crean movimiento `SALIDA`.
4. Ajustes corrigen diferencias con movimiento `AJUSTE` y validacion contra stock negativo.
5. Precios guardan historial por producto/proveedor y sirven como sugerencia al crear ordenes.
6. Ordenes reciben mercancia y generan entradas con referencia `OC-{id}`.
7. Dashboard resume datos agregados desde backend.

## Pruebas Ejecutadas
- `cd backend && mvn test`: 14 pruebas ejecutadas, 14 exitosas.
- `cd frontend && npm run build`: build exitoso.

## Pendientes O Riesgos
- `mvn clean test` no pudo borrar una carpeta de `backend/target` por bloqueo de archivo en Windows/OneDrive; `mvn test` si ejecuto correctamente.
- Falta una prueba manual completa con backend, frontend y MySQL corriendo.
- Las pruebas frontend siguen siendo build-time; no se agregaron specs Angular.
- Los textos visibles conservan en varios lugares palabras sin tilde para mantener consistencia con el proyecto actual.
