# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/), Versionado: [SemVer](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-05-15 - Sprint 2: Carrito + Checkout + Pagos mock

### Added

**Backend**

- App `cart` con modelos `Cart` (1:1 con `User`) y `CartItem` (unique por cart+product, snapshot de precio al agregar).
- Endpoints: `GET/DELETE /api/cart`, `POST /api/cart/store`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/{id}`.
- App `orders` con `Order` (FSM: pending_payment -> paid -> preparing -> dispatched -> delivered, con `cancelled` desde los 3 primeros) y `OrderItem` (snapshot SKU/nombre/imagen).
- App `payments` con `Payment` (1:1 a `Order`) y `PaymentGatewayStub` con interfaz idéntica a Culqi/MercadoPago (rechaza si `method=card` y `amount` termina en `.13`).
- App `notifications` con `NotificationLog` y `services.notify(...)` (stub: registra en BD).
- Endpoints checkout idempotente con header `Idempotency-Key`, listado e historial, cancelación con restock, repeat (recompone carrito), pago mock.
- Decremento de inventario por tienda dentro de transacción atómica con `select_for_update`.

**Frontend**

- `CartService` con `signal<Cart>` y `count` computed (badge contador).
- `OrdersService` con tipos completos de Order/OrderItem/Payment.
- Páginas `/cart` (líneas con +/- y eliminar, selector de tienda), `/checkout` (delivery/pickup, direcciones, fecha/horario, método de pago), `/orders` (historial), `/orders/:id` (detalle con CTA contextual: pagar mock / cancelar / repetir).
- Botón "Agregar al carrito" en detalle (redirige a login si no hay sesión).
- `authGuard` para rutas privadas.

## [0.2.0] - 2026-05-14 - Sprint 1 + Rebrand Mass

### Added

**Backend**

- App `accounts` con `User` custom (email como USERNAME_FIELD), `Address` con default único por usuario, endpoints `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/me`, `/api/me/addresses`.
- App `catalog` con `Category`, `Store`, `Product` (slug, precio, stock por tienda), `Inventory` (unique product+store).
- Endpoints `/api/categories`, `/api/stores`, `/api/products` (filtros: category, q, store, min_price, max_price, ordering, paginación 20/pg), `/api/products/{slug}`, `/api/search/suggest`.
- Management command `seed_catalog`: 3 tiendas Mass (Miraflores, San Isidro, Surco), 8 categorías, 71 productos.

**Frontend**

- Angular 17 standalone con TS estricto, build multistage Node→nginx.
- `AuthService` con signal y `localStorage` JWT, `jwtInterceptor`, `CatalogService` tipado.
- Páginas `/login`, `/register` (con auto-login), `/catalog`, `/product/:slug`.

### Changed

**Rebrand Mass aplicado:**

- Paleta: amarillo `#FFCC00` dominante, navy `#1D1145`, rojo `#E60000`, blanco.
- Tipografía Poppins 400-900. Flat design, sin sombras.
- Topbar barrial (Conoceme / Precios Mass / Ubicame / Trabaja Conmigo / Alquila tu local).
- Hero amarillo con badge circular rojo "Hasta 30% OFF".
- Tarjetas de producto con precio entero grande + centavos pequeños.

### Fixed

- Angular 17 interpreta `@` literal en templates como control-flow syntax (`@if`, `@for`). Escapar como `&#64;` (placeholders, claim "Caser@").

## [0.1.0] - 2026-05-14 - Sprint 0: Bootstrap

### Added

- `docker-compose.yml` con db (postgres:16), redis, backend (Django+DRF+gunicorn), ai-service (Flask+gunicorn), frontend, nginx gateway.
- Healthchecks y `depends_on: service_healthy` en backend.
- `apps/__init__.py` y estructura `backend/apps/` lista para apps DDD.
- `ai-service/` con stubs 501 para `/recommendations`, `/chat`, `/suggest-list`, `/predict-next-purchase` (reservados para Fase 2).
- `.env`, `.env.example`, `.gitignore`, README de arranque.
- OpenAPI publicado en `/api/schema` y Swagger UI en `/api/docs`.

### Tech

- Python 3.12, Django 5.0.7, DRF 3.15.2, `djangorestframework-simplejwt`, `drf-spectacular`, `psycopg2-binary`, `dj-database-url`, `python-decouple`.
- Node 20, Angular 17.3, TypeScript 5.4 estricto.
- Postgres 16, Redis 7, nginx 1.27 (todas alpine).
