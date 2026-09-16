import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const LOCAL_MODEL = "SmolLM2-360M-Instruct-q4f16_1-MLC";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const KEY_NAME = "ioEz_openrouter_key";

let engine = null;
let history = [];
let mode = localStorage.getItem("ioEz_mode") || "online";

const $ = (id) => document.getElementById(id);
const messages = $("messages");
const status = $("status");
const input = $("input");
const send = $("send");
const newChat = $("newChat");
const settings = $("settings");
const apiKey = $("apiKey");
const modeSelect = $("mode");
const modelSelect = $("model");

modeSelect.value = mode;
apiKey.value = localStorage.getItem(KEY_NAME) || "";

function setStatus(text) { status.textContent = text; }
function scrollDown() { messages.scrollTop = messages.scrollHeight; }
function setReady(ready) {
  input.disabled = !ready;
  send.disabled = !ready;
  if (ready) input.focus();
}

function renderMarkdownish(text) {
  const fragment = document.createDocumentFragment();
  const lines = text.split("\n");
  for (const line of lines) {
    const p = document.createElement("div");
    p.textContent = line;
    fragment.appendChild(p);
  }
  return fragment;
}

function addMessage(role, text, options = {}) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  row.dataset.role = role;

  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✦";
    row.appendChild(avatar);
  }

  const body = document.createElement("div");
  body.className = "message-body";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.appendChild(renderMarkdownish(text));
  body.appendChild(bubble);

  if (role === "assistant" && !options.streaming) {
    const tools = document.createElement("div");
    tools.className = "message-tools";
    const copy = document.createElement("button");
    copy.textContent = "Copiar";
    copy.onclick = async () => {
      await navigator.clipboard.writeText(text);
      copy.textContent = "Copiado ✓";
      setTimeout(() => { copy.textContent = "Copiar"; }, 1200);
    };
    const regen = document.createElement("button");
    regen.textContent = "Regenerar";
    regen.onclick = () => regenerate(row);
    tools.append(copy, regen);
    body.appendChild(tools);
  }

  row.appendChild(body);
  messages.appendChild(row);
  scrollDown();
  return bubble;
}

function welcome(text = "Tu IA, con más potencia.", detail = "Usa un modelo gratuito en la nube o cambia a modo local para ejecutar la IA directamente en tu dispositivo.") {
  messages.innerHTML = `<div class="welcome" id="welcome"><div class="welcome-icon">✦</div><h2>${text}</h2><p>${detail}</p><div class="welcome-actions"><button id="startOnline" class="primary" type="button">Usar IA gratuita</button><button id="startLocal" class="ghost big" type="button">Usar IA local</button></div><small>Online: OpenRouter Free · Local: WebLLM + WebGPU</small></div>`;
  $("startOnline").onclick = startOnline;
  $("startLocal").onclick = loadLocalAI;
}

async function startOnline() {
  mode = "online";
  modeSelect.value = mode;
  localStorage.setItem("ioEz_mode", mode);
  settings.classList.remove("hidden");

  const key = localStorage.getItem(KEY_NAME);
  if (!key) {
    setStatus("Falta una API key gratuita");
    addMessage("assistant", "Para usar la IA online gratuita, crea una API key de OpenRouter y guárdala en Ajustes. La clave se queda en este navegador; no la pongas dentro del código público.");
    return;
  }
  await activateOnline();
}

async function activateOnline() {
  mode = "online";
  localStorage.setItem("ioEz_mode", mode);
  setStatus("IA online gratuita lista");
  setReady(true);
  const welcomeNode = $("welcome");
  if (welcomeNode) welcomeNode.remove();
  if (!messages.querySelector(".message")) {
    addMessage("assistant", "¡Listo! Estoy conectado mediante el modelo gratuito de OpenRouter. ¿Qué quieres hacer?");
  }
}

async function loadLocalAI() {
  mode = "local";
  modeSelect.value = mode;
  localStorage.setItem("ioEz_mode", mode);
  if (engine) {
    setReady(true);
    setStatus("IA local activa");
    return;
  }

  settings.classList.add("hidden");
  let progress = document.createElement("div");
  progress.className = "progress";
  progress.textContent = "Preparando IA local…";
  const welcomeNode = $("welcome");
  if (welcomeNode) welcomeNode.replaceWith(progress); else messages.appendChild(progress);
  scrollDown();

  try {
    if (!navigator.gpu) throw new Error("Tu navegador no tiene WebGPU disponible.");
    setStatus("Descargando modelo local…");
    engine = await CreateMLCEngine(LOCAL_MODEL, {
      initProgressCallback: (p) => {
        const value = Math.round((p.progress || 0) * 100);
        progress.textContent = p.text ? `${p.text} ${value}%` : `Cargando IA… ${value}%`;
        setStatus(`Cargando ${value}%`);
      }
    });
    progress.remove();
    setStatus("IA local activa");
    setReady(true);
    addMessage("assistant", "IA local activada. Esta conversación no necesita una API.");
  } catch (error) {
    progress.className = "error";
    progress.textContent = `No se pudo cargar la IA local: ${error.message}`;
    setStatus("No se pudo iniciar");
  }
}

function getKey() {
  return localStorage.getItem(KEY_NAME) || "";
}

async function askOnline(text) {
  const key = getKey();
  if (!key) throw new Error("No hay una API key de OpenRouter guardada.");

  const selectedModel = modelSelect.value || "openrouter/free";
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": location.href,
      "X-Title": "ioEz AI"
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: "system", content: "Eres ioEz AI, un asistente útil, claro, amable y preciso. Responde en español salvo que el usuario pida otro idioma. No inventes herramientas o datos." },
        ...history
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
  return data?.choices?.[0]?.message?.content || "No recibí contenido de respuesta.";
}

async function askLocal(text) {
  if (!engine) await loadLocalAI();
  const stream = await engine.chat.completions.create({
    model: LOCAL_MODEL,
    messages: [
      { role: "system", content: "Eres ioEz AI, un asistente útil, claro y amable. Responde en español salvo que el usuario pida otro idioma." },
      ...history
    ],
    temperature: 0.7,
    max_tokens: 1000,
    stream: true
  });

  let answer = "";
  for await (const chunk of stream) {
    answer += chunk.choices?.[0]?.delta?.content || "";
  }
  return answer;
}

async function askAI(text, existingBubble = null) {
  const assistantBubble = existingBubble || addMessage("assistant", "Pensando…", { streaming: true });
  history.push({ role: "user", content: text });
  send.disabled = true;
  input.disabled = true;
  setStatus(mode === "online" ? "Pensando online…" : "Pensando localmente…");

  try {
    const answer = mode === "online" ? await askOnline(text) : await askLocal(text);
    assistantBubble.textContent = answer;
    history.push({ role: "assistant", content: answer });

    const tools = document.createElement("div");
    tools.className = "message-tools";
    const copy = document.createElement("button");
    copy.textContent = "Copiar";
    copy.onclick = async () => {
      await navigator.clipboard.writeText(answer);
      copy.textContent = "Copiado ✓";
      setTimeout(() => { copy.textContent = "Copiar"; }, 1200);
    };
    const regen = document.createElement("button");
    regen.textContent = "Regenerar";
    regen.onclick = () => regenerate(assistantBubble.closest(".message"));
    tools.append(copy, regen);
    assistantBubble.parentElement.appendChild(tools);
  } catch (error) {
    assistantBubble.textContent = `Error: ${error.message}`;
    history.pop();
  } finally {
    send.disabled = false;
    input.disabled = false;
    setStatus(mode === "online" ? "IA online gratuita lista" : "IA local activa");
    input.focus();
  }
}

async function regenerate(row) {
  const index = [...messages.querySelectorAll(".message")].indexOf(row);
  if (index < 1) return;
  const userRow = messages.querySelectorAll(".message")[index - 1];
  const text = userRow?.querySelector(".bubble")?.textContent?.trim();
  if (!text) return;
  history = history.slice(0, Math.max(0, history.length - 2));
  row.remove();
  await askAI(text);
}

$("composer").addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
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

$("settingsBtn").onclick = () => settings.classList.toggle("hidden");

$("saveKey").onclick = async () => {
  const value = apiKey.value.trim();
  if (!value) {
    localStorage.removeItem(KEY_NAME);
    setStatus("Clave eliminada");
    return;
  }
  localStorage.setItem(KEY_NAME, value);
  mode = "online";
  modeSelect.value = "online";
  localStorage.setItem("ioEz_mode", "online");
  await activateOnline();
};

$("clearKey").onclick = () => {
  localStorage.removeItem(KEY_NAME);
  apiKey.value = "";
  setStatus("Clave borrada");
};

modeSelect.onchange = async () => {
  mode = modeSelect.value;
  localStorage.setItem("ioEz_mode", mode);
  if (mode === "online") await startOnline();
  else await loadLocalAI();
};

$("newChat").onclick = () => {
  history = [];
  messages.innerHTML = "";
  addMessage("assistant", mode === "online" ? "Nuevo chat listo. ¿En qué te ayudo?" : "Nuevo chat local listo. ¿En qué te ayudo?");
};

$("clearChat").onclick = () => {
  history = [];
  messages.innerHTML = "";
  addMessage("assistant", "Chat borrado. Empezamos de cero ✨");
};

$("exportChat").onclick = () => {
  const output = history.map((m) => `${m.role === "user" ? "Tú" : "ioEz AI"}:\n${m.content}`).join("\n\n");
  const blob = new Blob([output || "Chat vacío"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ioez-chat-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

document.querySelectorAll(".quick-actions button").forEach((button) => {
  button.onclick = () => {
    input.disabled = false;
    input.value = button.dataset.prompt;
    input.focus();
    input.dispatchEvent(new Event("input"));
  };
});

if (mode === "online" && getKey()) activateOnline();
else if (mode === "local") loadLocalAI();
