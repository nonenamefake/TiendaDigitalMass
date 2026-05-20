# Roadmap

## Estado actual: MVP funcional (Sprints 0-2)

15 de los 25 requisitos del prompt original ya cubiertos en el MVP. Stack levantado con `docker compose up`.

## Sprint 3 - Post-venta + extras

- Reseñas y calificación (1-5 estrellas, comentario).
- Lista de favoritos.
- Cupones y promociones (admin define, usuario aplica en checkout).
- Búsqueda mejorada con `pg_trgm` y `tsvector` para autocomplete fonético.
- Cancelación con motivo y reembolso simulado.

## Sprint 4 - Admin + hardening

- Panel admin Angular (productos, inventario, cupones, pedidos, cambio de estado).
- Rate-limiting en `/auth/*` y `/search/*`.
- Tests pytest backend ≥70% cobertura; Cypress smoke frontend.
- Logs estructurados JSON con `structlog`, correlación por `X-Request-Id`.
- Documentación de deploy a cloud.

## Fase 2 - IA + integraciones reales

Los ganchos ya están listos en el MVP:

- `apps/ai_bridge/` con cliente HTTP a `ai-service` (Flask).
- `NotificationLog` listo para SendGrid/Twilio/WhatsApp sin tocar dominio.
- `PaymentGatewayStub` con interfaz idéntica a Culqi/MercadoPago.

**Features IA pendientes:**

- Chatbot atención al cliente (LLM externo via API).
- Recomendaciones personalizadas ("también te puede interesar").
- Listas de compra automáticas con IA.
- Predicción de productos futuros según comportamiento.
- Detección de intención de compra.

**Integraciones reales:**

- Pasarela Culqi/MercadoPago/Niubiz reemplazando `PaymentGatewayStub`.
- Email transaccional (SendGrid / SMTP).
- WhatsApp Business API para notificaciones (más usado que SMS en Perú).
- Tracking en tiempo real con WebSocket + integración con courier.

## Requisitos del prompt - estado

| # | Requisito | Estado |
|---|-----------|--------|
| 1 | Registro/login/perfil | ✓ Sprint 1 |
| 2 | Catálogo con categorías y filtros | ✓ Sprint 1 |
| 3 | Gestión de carrito | ✓ Sprint 2 |
| 4 | Pagos (tarjeta, billetera, contra entrega) | ✓ Sprint 2 (mock) |
| 5 | Recomendaciones IA | ⏳ Fase 2 |
| 6 | Búsqueda con sugerencias en tiempo real | ✓ Sprint 1 (sin IA) |
| 7 | Detalle de productos | ✓ Sprint 1 |
| 8 | Notificación estado pedido (correo/SMS) | ✓ Sprint 2 (stub) |
| 9 | Calificar y reseñar productos | ⏳ Sprint 3 |
| 10 | Listas de compra automáticas IA | ⏳ Fase 2 |
| 11 | Aplicar cupones y promociones | ⏳ Sprint 3 |
| 12 | Programar entrega con fecha/horario | ✓ Sprint 2 |
| 13 | Historial y repetir compras | ✓ Sprint 2 |
| 14 | Gestionar inventario y precios (admin) | ✓ Sprint 1 (admin Django) |
| 15 | Chatbot IA atención al cliente | ⏳ Fase 2 |
| 16 | Múltiples direcciones de envío | ✓ Sprint 1 |
| 17 | Cancelar pedidos antes del despacho | ✓ Sprint 2 |
| 18 | Seguimiento de pedido en tiempo real | ⏳ Fase 2 |
| 19 | Productos favoritos | ⏳ Sprint 3 |
| 20 | Comparar productos | ⏳ Fase 2 |
| 21 | Alertas de ofertas personalizadas | ⏳ Fase 2 |
| 22 | Detectar intención de compra (IA) | ⏳ Fase 2 |
| 23 | Predecir productos futuros (IA) | ⏳ Fase 2 |
| 24 | Disponibilidad según ubicación | ✓ Sprint 1 (filtro por tienda) |
| 25 | Selección de tienda para recojo | ✓ Sprint 2 |

**Cobertura MVP: 15/25 (60%).**
