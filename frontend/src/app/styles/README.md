# Tokens y utilidades de estilo

Pequena guia para el sistema de design tokens del frontend. Todos los tokens se exponen como variables CSS en `:root` (modo claro) y se redefinen bajo `body.theme-dark` para el modo oscuro.

## Donde vive

- `_tokens.scss` — variables CSS de color, espaciado, radios, sombras, motion y z-index. Tambien define los temas Material.
- `_typography.scss` — variables de fuente y clases utilitarias (`.t-display`, `.t-h1`, `.t-meta`...).
- `_a11y.scss` — focus visible, skip link, `prefers-reduced-motion`.
- `styles.scss` (raiz) — usa los tres parciales con `@use`. Cualquier estilo verdaderamente global vive aqui.

## Convencion general

> Usa siempre el token, no el valor literal. Si necesitas un valor que no existe, agregalo al token antes de usarlo.

```scss
// si
padding: var(--app-space-4);
color: var(--app-muted);
box-shadow: var(--app-elevation-2);

// no
padding: 16px;
color: #52615f;
box-shadow: 0 6px 16px rgba(22, 48, 45, 0.08);
```

## Espaciado

Escala 4px. Usar en padding/margin/gap.

| Token | Valor | Uso tipico |
|---|---|---|
| `--app-space-1` | 4px | gaps tight (chips, kbds) |
| `--app-space-2` | 8px | gap entre icon y texto |
| `--app-space-3` | 12px | gap entre acciones, padding compacto |
| `--app-space-4` | 16px | padding default de form fields |
| `--app-space-5` | 20px | padding de paneles |
| `--app-space-6` | 24px | padding de heroes |
| `--app-space-7` | 32px | padding de pagina |
| `--app-space-8` / `--app-space-9` | 40px / 48px | spacers de seccion grande |

Atajos: `.u-stack-N` y `.u-row-N` aplican `display: flex; gap: var(--app-space-N)`.

## Radios

`--app-radius-1` (4px) hasta `--app-radius-5` (16px) y `--app-radius-pill` para chips. Default para paneles y botones: `--app-radius-3` (8px).

## Color

Todas las superficies vienen de tokens; nunca uses hex directo. El modo oscuro se activa en `body.theme-dark` y solo redefine los tokens — no crea selectores nuevos.

- Texto: `--app-text`, `--app-heading`, `--app-muted`, `--app-muted-strong`.
- Superficies: `--app-surface` (base), `--app-surface-soft` (panel hover), `--app-surface-muted` (chips inactivas).
- Bordes: `--app-border`, `--app-border-strong`.
- Brand y semanticas: `--app-brand`, `--app-brand-strong`, `--app-accent`, `--app-warning`, `--app-danger`, `--app-success`.
- Topbar: `--app-topbar-start`, `--app-topbar-end` (gradiente del header).
- Fila hover: `--app-row-hover`.
- Focus ring: `--app-focus-ring`, `--app-focus-ring-danger`.

Para mezclas (ej. tinte 12 % del brand sobre la superficie) usar `color-mix`:

```scss
background: color-mix(in srgb, var(--app-brand) 12%, var(--app-surface));
```

## Sombras

`--app-elevation-1` a `--app-elevation-4`. Alias `--app-shadow` (`= elevation-3`) y `--app-shadow-strong` (`= elevation-4`). Cards y paneles usan `elevation-2`; dialogos y popovers, `elevation-3`.

## Motion

| Token | Valor | Cuando |
|---|---|---|
| `--app-dur-fast` | 120ms | hover de chip, color de un boton |
| `--app-dur-base` | 180ms | hover de fila, animaciones de panel, transicion de tema |
| `--app-dur-slow` | 280ms | entrada del login, dialogos grandes |
| `--app-ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | entradas / hover |
| `--app-ease-inout` | `cubic-bezier(0.4, 0, 0.2, 1)` | expand-row, stepper |

Las preferencias del usuario se respetan: `prefers-reduced-motion: reduce` desactiva animaciones desde `_a11y.scss`.

## Tipografia

Tamanos: `--app-font-12` a `--app-font-32`. Pesos: `regular`, `medium`, `semibold`, `bold`. Interlineados: `tight`, `snug`, `normal`, `loose`. Tracking: `tight`, `normal`, `wide`.

Clases utilitarias listas para usar:

- `.t-eyebrow` — caps con tracking ancho, color brand.
- `.t-display`, `.t-h1`, `.t-h2`, `.t-h3` — jerarquia de titulos.
- `.t-body`, `.t-body-strong`, `.t-meta`, `.t-caption` — texto corrido.
- `.t-numeric` — habilita `font-variant-numeric: tabular-nums` para columnas de numeros.

## A11y

- `.sr-only` esconde visualmente pero deja el contenido para lectores de pantalla.
- `:focus-visible` global usa `--app-focus-ring`.
- `.skip-link` se posiciona absoluta y aparece al recibir foco — wireada en el shell.
- `@media (prefers-reduced-motion)` reduce todas las animaciones globalmente.

## Atajos de teclado

Registrados en `KeyboardShortcutsService` (`shared/keyboard-shortcuts.service.ts`):

| Tecla | Accion |
|---|---|
| `?` | Abre el dialogo de atajos |
| `/` | Enfoca el primer filtro del modulo activo |
| `g d` / `g p` / `g m` | Dashboard / Productos / Movimientos |
| `g s` / `g r` / `g o` | Proveedores / Precios / Ordenes |
| `g u` | Usuarios |
| `Esc` | Cierra dialogo abierto (manejado por MatDialog) |

Para agregar un atajo nuevo:

1. Agregalo a `SHORTCUTS` en `keyboard-shortcuts.service.ts` para que aparezca en la ayuda.
2. Llama a `shortcuts.register('g x', () => ...)` desde el componente que lo provee (idealmente el `ShellComponent`).

## Componentes shared relevantes

- `app-page-header` — hero estandar con eyebrow + h1 + subtitle + slot `[actions]`.
- `app-data-table` — tabla generica con paginacion, sort, skeleton y empty state.
- `app-empty-state` — bloque de estado vacio con icon + slot `[action]`.
- `app-skeleton-table` — placeholder de tabla mientras carga.
- `confirm.service` — confirm async; usar `variant: 'danger'` para acciones destructivas.
- `notify.service` — wrapper de `MatSnackBar` con `success/info/warning/error`.

Si vas a agregar una nueva pantalla, empieza por estos shared antes de construir nada desde cero.
