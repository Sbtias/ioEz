# ioEz AI

Interfaz web de `ioez`, creada por **Sbtias**.

## Backend

ioez ahora incluye un backend real con Node.js y SQLite.

- `GET /api/health` — estado del backend.
- `GET /api/updates` — historial de actualizaciones.
- `GET /api/conversations` — historial de conversaciones.
- `GET /api/conversations/:id` — mensajes de una conversación.
- `POST /api/chat` — envía mensajes a OpenRouter desde el servidor.

Requiere **Node.js 22.5+** por el uso de `node:sqlite`.

```bash
npm start
```

Después abre `http://localhost:3000`.

## OpenRouter

Configura la clave del servidor mediante una variable de entorno:

```text
OPENROUTER_API_KEY=tu_clave
```

El archivo `.env.example` contiene la plantilla. Nunca pongas una clave real dentro de `index.html`, `server.js` o un commit de GitHub.

También existe una opción de **API key personal** en Ajustes. Esa clave se almacena en el navegador y se manda al backend solo durante las peticiones; el backend no la guarda en SQLite.

## Historial

El historial de conversaciones queda persistido en SQLite. El historial de actualizaciones se guarda en la tabla `updates` y se muestra desde el botón **Historial de actualizaciones** en la aplicación.

## SQL

`database/schema.sql` contiene las tablas de usuarios, conversaciones, mensajes, eventos de uso y actualizaciones.

La base de datos local se crea automáticamente en `data/ioez.sqlite` cuando arranca el servidor. Ese archivo debe mantenerse fuera del repositorio si se usa despliegue público.

## Correcciones

- `Ctrl + F5`, `Ctrl + R`, `Cmd + R` y `F5` no se procesan como texto del chat.
- El historial permanece visible en la barra lateral en escritorio.
- En móvil, el historial se abre desde el botón de menú sin eliminar la función.
- Ajustes permite guardar, mostrar, borrar y probar la configuración de API.
- El estado del backend se muestra en la interfaz.
