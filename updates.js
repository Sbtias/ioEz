const UPDATES = [
  {
    version: "v0.5.0",
    date: "16 Sep 2026",
    title: "Animaciones estilo Apple",
    changes: ["Transiciones suaves y fluidas entre estados de la interfaz.","Entradas y salidas con movimiento sutil para paneles, mensajes y controles.","Microinteracciones más refinadas al abrir, cerrar, cambiar de modo y pulsar botones.","Sensación más limpia y premium, inspirada en la fluidez de las interfaces de Apple."]
  },
  {
    version: "v0.4.0",
    date: "16 Sep 2026",
    title: "Commandos de imágenes",
    changes: ["Búsqueda de imágenes desde el chat con Wikimedia Commons.","Cambio de avatar mediante comandos como 'ponte una imagen de ...'.","Resultados visuales integrados en las respuestas."]
  },
  {
    version: "v0.3.0",
    date: "16 Sep 2026",
    title: "Personalidad ioEz",
    changes: ["Personalidad fría, directa y rebelde.","Humor seco e ironía ligera.","Respuestas orientadas a ser útiles, claras y directas."]
  },
  {
    version: "v0.2.0",
    date: "16 Sep 2026",
    title: "IA online + local",
    changes: ["Modo online con OpenRouter Free.","Modo local con WebLLM y WebGPU.","Historial local, nuevo chat, borrar, exportar, copiar, regenerar y lectura por voz."]
  },
  {
    version: "v0.1.0",
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