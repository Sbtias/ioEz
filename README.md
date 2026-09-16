# ioEz AI

Interfaz web de `ioez`, creada por **Sbtias**.

## IA online

ioez puede usar OpenRouter desde el navegador. La configuración se hace directamente desde **Ajustes**:

1. Abre **Ajustes**.
2. Pega tu propia OpenRouter API key en **OpenRouter API key**.
3. Escribe o confirma el modelo que quieres usar.
4. Pulsa **Guardar ajustes**.
5. Usa **Probar API** para comprobar la conexión.

La clave se guarda solamente en `localStorage` de ese navegador y no se incluye en el repositorio.

> Importante: una API key usada desde una web estática puede quedar accesible en el navegador. Para una aplicación pública con usuarios reales, mantén la clave en un backend.

## Correcciones recientes

- `Ctrl + F5`, `Ctrl + R`, `Cmd + R` y `F5` ya no se interpretan como escritura del chat.
- Los atajos con modificadores no se insertan accidentalmente en el textarea.
- La caja de mensaje se redimensiona automáticamente y bloquea el envío durante una petición.
- Mejor manejo de errores de API y estados de conexión.
- Historial y conversaciones guardadas localmente.
- Paneles funcionales para Historial, Cuenta y Ajustes.
- Tema oscuro, claro y sistema.
- Exportación de chats a `.txt`.
- Diseño responsive para PC, iPhone y Android.

## Archivos principales

La interfaz principal es autocontenida en:

`index.html`

El repositorio conserva otros archivos del proyecto para compatibilidad y futuras integraciones.

## SQL

La carpeta `database/` contiene el esquema SQL preparado para cuentas, conversaciones, mensajes y eventos de uso. El esquema todavía necesita un backend para ejecutar consultas y autenticar usuarios de forma segura.
