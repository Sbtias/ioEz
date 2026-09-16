# ioEz AI

IA de chat que corre **directamente en el navegador**, sin OpenAI API, sin clave y sin servidor propio.

## Cómo funciona

Usa WebLLM + SmolLM2 360M. El modelo se descarga la primera vez y la inferencia se ejecuta localmente mediante WebGPU. El modelo usado por el proyecto está publicado en formato MLC para WebLLM.

## Uso

1. Abre la página desde GitHub Pages.
2. Pulsa **Cargar IA**.
3. Espera a que termine la primera descarga.
4. Escribe y conversa.

Después de la primera carga, el navegador puede reutilizar los archivos almacenados en caché.

## Importante

- No hay llamadas a una API de IA.
- No necesitas introducir una API key.
- No necesitas pagar un servidor.
- La primera descarga puede tardar y ocupar espacio de caché.
- Necesitas un navegador con WebGPU. Si el dispositivo no tiene WebGPU compatible, esta versión no podrá ejecutar el modelo.
- Un modelo de 360M parámetros es ligero, pero su calidad no es comparable a modelos grandes de servicios en la nube.

Archivos: `index.html`, `style.css`, `app.js`.
