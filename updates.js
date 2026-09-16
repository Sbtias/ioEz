const UPDATES = [
  {
    version: "v0.7",
    date: "16 Sep 2026",
    title: "Sistema de cuentas",
    changes: ["Crear cuenta e iniciar sesión desde una interfaz glass.","Perfil visible con nombre y correo.","Cerrar sesión desde el panel de cuenta.","Persistencia local de la cuenta en el navegador."]
  },
  {
    version: "v0.6",
    date: "16 Sep 2026",
    title: "Apple Glass + sistema de créditos",
    changes: ["Rediseño visual blanco inspirado en interfaces limpias y minimalistas.","Efecto glass con desenfoque, transparencia, sombras suaves y profundidad en toda la interfaz.","Animaciones refinadas en mensajes, paneles, botones, tarjetas, composer y microinteracciones.","Sistema de créditos locales: 10 créditos nuevos cada 5 minutos, hasta 100 acumulados.","Las consultas consumen una cantidad variable de créditos según su complejidad estimada.","Contador de créditos visible directamente en la barra superior y temporizador de regeneración."]
  },
  {
    version: "v0.0.1",
    date: "16 Sep 2026",
    title: "Ajuste de animaciones",
    changes: ["Pequeñas mejoras de fluidez y transiciones en la interfaz."]
  },
  {
    version: "v0.4",
    date: "16 Sep 2026",
    title: "Comandos de imágenes",
    changes: ["Búsqueda de imágenes desde el chat con Wikimedia Commons.","Cambio de avatar mediante comandos como 'ponte una imagen de ...'.","Resultados visuales integrados en las respuestas."]
  },
  {
    version: "v0.3",
    date: "16 Sep 2026",
    title: "Personalidad ioEz",
    changes: ["Personalidad fría, directa y rebelde.","Humor seco e ironía ligera.","Respuestas orientadas a ser útiles, claras y directas."]
  },
  {
    version: "v0.2",
    date: "16 Sep 2026",
    title: "IA online + local",
    changes: ["Modo online con OpenRouter Free.","Modo local con WebLLM y WebGPU.","Historial local, nuevo chat, borrar, exportar, copiar, regenerar y lectura por voz."]
  },
  {
    version: "v0.1",
    date: "16 Sep 2026",
    title: "Nacimiento de ioEz",
    changes: ["Interfaz de chat moderna y responsive.","Tema oscuro y claro.","Panel de ajustes y configuración del modelo.","Soporte para PC, iPhone y Android."]
  }
];

const list = document.getElementById("updatesList");

function renderUpdates() {
  if (!list) return;
  list.innerHTML = UPDATES.map((update, index) => `
    <article class="update-card ${index === 0 ? "latest" : ""}">
      <div class="update-meta"><span class="update-version">${update.version}</span><span>${update.date}</span>${index === 0 ? '<span class="latest-badge">ÚLTIMA</span>' : ""}</div>
      <h3>${update.title}</h3>
      <ul>${update.changes.map(change => `<li>${change}</li>`).join("")}</ul>
    </article>
  `).join("");
}

renderUpdates();

const updatesPanel = document.getElementById("updatesPanel");
document.getElementById("updatesBtn")?.addEventListener("click", () => updatesPanel?.classList.toggle("hidden"));
document.getElementById("closeUpdates")?.addEventListener("click", () => updatesPanel?.classList.add("hidden"));