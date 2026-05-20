# Aclaracion

Este proyecto es creado con fines de aprendisaje y educativo, **no tiene ninguna relacion con la empresa "Mass"** ni se esta usando su nombre con fines lucrativos. El uso de su nombre se deve a que se recreo una problematica sobre una **empresa real** con fines de educativos.

# Catalogo Mass

E-commerce de supermercado online para **Compania Hard Discount (Mass)**.

Stack: Django + DRF (API) | Flask (microservicio IA - Fase 2) | Angular (frontend) | PostgreSQL | Redis | Nginx | Docker Compose.

## Requisitos

- Docker Desktop (Docker Engine 24+ y Compose v2+).

## Arranque

```powershell
copy .env.example .env       # ya viene uno por defecto
docker compose up --build -d
```

Verifica los healthchecks:

```powershell
docker compose ps
```

Cuando todos los servicios marquen `healthy`/`running`, abre:

| URL                              | Servicio                       |
|----------------------------------|--------------------------------|
| http://localhost:8080            | Gateway nginx (frontend + API) |
| http://localhost:8080/api/health | Health del backend (via gateway) |
| http://localhost:8080/api/docs   | Swagger UI                     |
| http://localhost:8000/api/health | Backend Django directo         |
| http://localhost:5001/health     | AI service (Flask) directo     |
| http://localhost:4200            | Frontend placeholder directo   |

## Servicios

| Servicio   | Imagen / Build           | Puerto host |
|------------|--------------------------|-------------|
| db         | postgres:16-alpine       | 5432        |
| redis      | redis:7-alpine           | 6379        |
| backend    | ./backend (Django)       | 8000        |
| ai-service | ./ai-service (Flask)     | 5001 -> 5000 |
| frontend   | ./frontend (nginx static) | 4200 -> 80 |
| nginx      | nginx:1.27-alpine        | 8080        |

## Comandos utiles

```powershell
docker compose logs -f backend          # logs backend
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell
docker compose down                     # detener
docker compose down -v                  # detener y borrar volumen postgres
```

## Estructura

```
catalogo-mass/
  backend/        Django + DRF
  ai-service/    Flask (microservicio IA, stubs Fase 2)
  frontend/      Placeholder; Angular completo en Sprint 1
  infra/nginx/   Configuracion del gateway
  docker-compose.yml
  .env.example
```

## Roadmap

- **S0** (actual): Bootstrap, healthchecks, OpenAPI vacio.
- **S1**: Auth + Catalogo + busqueda basica.
- **S2**: Carrito + Checkout + pago mock.
- **S3**: Post-venta (historial, cancelacion, favoritos, resenas, cupones).
- **S4**: Admin + hardening + tests >=70%.
- **Fase 2**: IA (chatbot, recomendaciones, listas auto, prediccion).
