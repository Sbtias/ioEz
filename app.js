import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const MODEL = "SmolLM2-360M-Instruct-q4f16_1-MLC";
let engine = null;
let history = [];

const $ = (id) => document.getElementById(id);
const messages = $("messages");
const status = $("status");
const input = $("input");
const send = $("send");
const start = $("start");
const newChat = $("newChat");

function setStatus(text) { status.textContent = text; }
function scrollDown() { messages.scrollTop = messages.scrollHeight; }

function addMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✦";
    row.appendChild(avatar);
  }
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  messages.appendChild(row);
  scrollDown();
  return bubble;
}

async function loadAI() {
  if (engine) return;
  start.disabled = true;
  setStatus("Descargando modelo…");
  const progress = document.createElement("div");
  progress.className = "progress";
  progress.textContent = "Primera carga: descargando el modelo local. No cierres la página.";
  messages.appendChild(progress);
  scrollDown();

  try {
    if (!navigator.gpu) throw new Error("Tu navegador no tiene WebGPU disponible. Prueba Chrome/Edge actualizado en un equipo compatible.");
    engine = await CreateMLCEngine(MODEL, {
      initProgressCallback: (p) => {
        const value = Math.round((p.progress || 0) * 100);
        progress.textContent = p.text ? `${p.text} ${value}%` : `Cargando IA… ${value}%`;
        setStatus(`Cargando ${value}%`);
      }
    });
    progress.remove();
    setStatus("IA local activa");
    input.disabled = false;
    send.disabled = false;
    start.remove();
    addMessage("assistant", "¡Listo! Soy ioEz AI. Estoy ejecutándome localmente en tu navegador, sin API ni servidor propio. ¿Qué quieres hacer?");
    input.focus();
  } catch (error) {
    progress.textContent = `No se pudo cargar la IA: ${error.message}`;
    progress.className = "error";
    setStatus("No se pudo iniciar");
    start.disabled = false;
  }
}

async function askAI(text) {
  const assistantBubble = addMessage("assistant", "");
  history.push({ role: "user", content: text });
  send.disabled = true;
  input.disabled = true;
  setStatus("Pensando localmente…");

  try {
    const stream = await engine.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "Eres ioEz AI, un asistente útil, claro y amable. Responde en español salvo que el usuario pida otro idioma. No inventes capacidades que no tienes." },
        ...history
      ],
      temperature: 0.7,
      max_tokens: 700,
      stream: true
    });

    let answer = "";
    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";
      answer += token;
      assistantBubble.textContent = answer;
      scrollDown();
    }
    history.push({ role: "assistant", content: answer });
  } catch (error) {
    assistantBubble.textContent = `Error local: ${error.message}`;
    history.pop();
  } finally {
    send.disabled = false;
    input.disabled = false;
    setStatus("IA local activa");
    input.focus();
  }
}

$("composer").addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || !engine) return;
  input.value = "";
  input.style.height = "auto";
  addMessage("user", text);
  await askAI(text);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    $("composer").requestSubmit();
  }
});

start.addEventListener("click", loadAI);

newChat.addEventListener("click", () => {
  history = [];
  messages.innerHTML = "";
  if (engine) addMessage("assistant", "Nuevo chat listo. ¿En qué te ayudo?");
  else {
    messages.innerHTML = `<div class="welcome"><div class="welcome-icon">✦</div><h2>Tu IA, directamente en tu dispositivo.</h2><p>Carga el modelo local para comenzar.</p><button id="startAgain" class="primary" type="button">Cargar IA</button><small>SmolLM2 360M · WebLLM · WebGPU</small></div>`;
    $("startAgain").addEventListener("click", loadAI);
  }
});
