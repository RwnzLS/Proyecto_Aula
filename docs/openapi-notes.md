# OpenAPI

Con el backend en ejecucion, la documentacion interactiva esta disponible en:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Para exportar el contrato:

```bash
curl http://localhost:8080/v3/api-docs -o docs/openapi.json
```
