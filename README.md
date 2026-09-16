# ioEz AI

Asistente web con dos modos:

- **Online gratuito:** usa `openrouter/free` mediante OpenRouter. Actualmente OpenRouter ofrece modelos gratuitos a coste $0 por tokens y su plan Free indica un límite de 50 solicitudes al día. Los límites y modelos disponibles pueden cambiar. citeturn426786search3turn426786search5
- **Local:** usa WebLLM + SmolLM2 360M en el dispositivo, sin API.

## Configurar la IA online

1. Abre la página de claves de OpenRouter.
2. Crea tu propia API key gratuita.
3. En ioEz AI abre **Ajustes**.
4. Elige **Online — API gratuita**.
5. Pega la clave y pulsa **Guardar clave**.

La clave se guarda solamente en el `localStorage` del navegador y no está incluida en el repositorio.

> Importante: esta implementación es una web estática, por lo que la clave introducida en el navegador debe tratarse como secreta para ese dispositivo. No se ha escrito ninguna clave real dentro del código público.

## Funciones añadidas

- Selector entre IA online gratuita y IA local.
- Configuración de API key sin subirla a GitHub.
- Selector del router/modelo gratuito disponible.
- Historial de conversación durante la sesión.
- Nuevo chat y borrar chat.
- Copiar respuestas.
- Regenerar respuestas.
- Exportar la conversación a `.txt`.
- Prompts rápidos para explicar, programar y generar ideas.
- Diseño adaptable para PC, iPhone y Android.

## Archivos

`index.html` · `style.css` · `app.js`
