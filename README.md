# IOYU

Aplicación web de IA creada por **Sbtias**.

## Cómo funciona

IOYU es una aplicación **100% estática**. No necesita Node.js, servidor propio, SQLite ni backend.

La aplicación pide una API key personal de OpenRouter antes de permitir el acceso. La clave se usa directamente desde el navegador para realizar las solicitudes a OpenRouter.

## Desarrollo local

Abre `index.html` en el navegador o usa cualquier servidor estático, como la extensión Live Server de VS Code.

No ejecutes `node server.js`: ese backend ya no forma parte del proyecto.

## Perfil

El perfil local permite cambiar el nombre y la foto. El nombre elegido se usa para que IOYU pueda reconocer al usuario dentro de las conversaciones.

## Ajustes

Los ajustes solo contienen preferencias como modelo y tema. La API key no aparece en Ajustes.

Para cambiarla, usa **Perfil → Cambiar API key**. Eso bloquea de nuevo la aplicación hasta introducir otra clave.

## Privacidad

La API key no debe publicarse, pegarse en GitHub ni compartirse. En esta arquitectura la clave está disponible para el JavaScript del navegador porque la aplicación se conecta directamente con OpenRouter.
