import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const LOCAL_MODEL = "SmolLM2-360M-Instruct-q4f16_1-MLC";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const KEY_NAME = "ioEz_openrouter_key";
const HISTORY_KEY = "ioEz_history";
const MODE_KEY = "ioEz_mode";
const THEME_KEY = "ioEz_theme";
const SYSTEM_PROMPT = `Eres ioEz AI, un asistente conversacional natural, cercano y útil. Habla como una persona amable: muestra empatía cuando corresponda, usa lenguaje claro y evita sonar robótico. Responde en español salvo que el usuario pida otro idioma. Sé directo pero con contexto suficiente. No inventes datos, herramientas ni acciones que no hayas realizado. Para código, entrega soluciones completas y explica los errores de forma sencilla. Puedes usar emojis con moderación cuando encajen.`;

let engine = null;
let history = loadHistory();
let mode = localStorage.getItem(MODE_KEY) || "online";
let generating = false;

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
const themeBtn = $("themeBtn");

modeSelect.value = mode;
apiKey.value = localStorage.getItem(KEY_NAME) || "";
applyTheme(localStorage.getItem(THEME_KEY) || "dark");

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((m) => m?.role && m?.content) : [];
  } catch {
    return [];
  }
}

function persistHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40)));
}

function setStatus(text) { status.textContent = text; }
function scrollDown() { messages.scrollTop = messages.scrollHeight; }
function setReady(ready) {
  input.disabled = !ready;
  send.disabled = !ready || generating;
}

function renderText(text) {
  const fragment = document.createDocumentFragment();
  for (const line of String(text).split("\n")) {
    const div = document.createElement("div");
    div.textContent = line || "\u00a0";
    fragment.appendChild(div);
  }
  return fragment;
}

function createTools(answer, row, userText) {
  const tools = document.createElement("div");
  tools.className = "message-tools";

  const copy = document.createElement("button");
  copy.textContent = "Copiar";
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      copy.textContent = "Copiado ✓";
      setTimeout(() => { copy.textContent = "Copiar"; }, 1200);
    } catch { copy.textContent = "No disponible"; }
  };

  const regen = document.createElement("button");
  regen.textContent = "Regenerar";
  regen.onclick = () => regenerate(row, userText);

  const speak = document.createElement("button");
  speak.textContent = "🔊 Leer";
  speak.onclick = () => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = /[áéíóúñ]/i.test(answer) ? "es-ES" : "en-US";
    speechSynthesis.speak(utterance);
  };

  tools.append(copy, regen, speak);
  return tools;
}

function addMessage(role, text, options = {}) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const body = document.createElement("div");
  body.className = "message-body";

  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✦";
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.appendChild(renderText(text));
  body.appendChild(bubble);

  if (role === "assistant" && !options.streaming && text) {
    body.appendChild(createTools(text, row, options.userText || ""));
  }

  row.appendChild(body);
  messages.appendChild(row);
  scrollDown();
  return bubble;
}

function showWelcome() {
  messages.innerHTML = `
    <div class="welcome" id="welcome">
      <div class="welcome-icon">✦</div>
      <span class="eyebrow">ioEz AI</span>
      <h2>¿Qué hacemos hoy?</h2>
      <p>Un asistente rápido, natural y personal. Puedes usar la nube gratuita o ejecutar el modelo directamente en tu dispositivo.</p>
      <div class="welcome-actions">
        <button id="startOnline" class="primary" type="button">Usar IA gratuita</button>
        <button id="startLocal" class="ghost big" type="button">Usar IA local</button>
      </div>
      <div class="capabilities">
        <span>💬 Chat</span><span>💻 Código</span><span>🧠 Ideas</span><span>🔊 Voz</span>
      </div>
    </div>`;
  $("startOnline").onclick = startOnline;
  $("startLocal").onclick = loadLocalAI;
}

function renderSavedChat() {
  messages.innerHTML = "";
  if (!history.length) {
    showWelcome();
    return;
  }
  for (const item of history) addMessage(item.role === "user" ? "user" : "assistant", item.content, { userText: "" });
}

async function startOnline() {
  mode = "online";
  modeSelect.value = mode;
  localStorage.setItem(MODE_KEY, mode);
  const key = localStorage.getItem(KEY_NAME);
  if (!key) {
    settings.classList.remove("hidden");
    setStatus("Añade tu clave de OpenRouter");
    addMessage("assistant", "Para usar la IA online necesito una API key de OpenRouter. Pégala en ⚙️ Ajustes y vuelve a pulsar “Usar IA gratuita”.");
    return;
  }
  await activateOnline();
}

async function activateOnline() {
  const welcome = $("welcome");
  if (welcome) welcome.remove();
  setStatus("IA online lista");
  setReady(true);
  if (!history.length) {
    addMessage("assistant", "¡Hey! Soy ioEz 👋. Estoy listo. Cuéntame qué necesitas y lo resolvemos juntos.");
  } else {
    renderSavedChat();
  }
}

async function loadLocalAI() {
  mode = "local";
  modeSelect.value = mode;
  localStorage.setItem(MODE_KEY, mode);
  if (engine) {
    activateLocalUI();
    return;
  }

  settings.classList.add("hidden");
  const old = $("welcome");
  if (old) old.remove();
  const progress = document.createElement("div");
  progress.className = "progress";
  progress.textContent = "Preparando el modelo local…";
  messages.appendChild(progress);

  try {
    if (!navigator.gpu) throw new Error("Este navegador no tiene WebGPU disponible.");
    setStatus("Descargando modelo local…");
    engine = await CreateMLCEngine(LOCAL_MODEL, {
      initProgressCallback: (p) => {
        const value = Math.round((p.progress || 0) * 100);
        progress.textContent = p.text ? `${p.text} ${value}%` : `Cargando IA… ${value}%`;
        setStatus(`Cargando ${value}%`);
      }
    });
    progress.remove();
    activateLocalUI();
  } catch (error) {
    progress.className = "error";
    progress.textContent = `No se pudo cargar la IA local: ${error.message}`;
    setStatus("IA local no disponible");
  }
}

function activateLocalUI() {
  setStatus("IA local activa");
  setReady(true);
  if (!history.length) addMessage("assistant", "Modo local activo 🧠. No necesitas una API para conversar conmigo.");
  else renderSavedChat();
}

function getKey() { return localStorage.getItem(KEY_NAME) || ""; }

async function askOnline() {
  const key = getKey();
  if (!key) throw new Error("Falta la API key de OpenRouter.");
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
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      temperature: 0.8,
      max_tokens: 1200,
      stream: false
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
  return data?.choices?.[0]?.message?.content?.trim() || "No recibí texto del modelo.";
}

async function askLocal() {
  if (!engine) await loadLocalAI();
  const stream = await engine.chat.completions.create({
    model: LOCAL_MODEL,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
    temperature: 0.8,
    max_tokens: 1200,
    stream: true
  });
  let answer = "";
  for await (const chunk of stream) answer += chunk.choices?.[0]?.delta?.content || "";
  return answer.trim();
}

async function askAI(text, existingBubble = null, userRow = null) {
  const assistantBubble = existingBubble || addMessage("assistant", "", { streaming: true });
  history.push({ role: "user", content: text });
  persistHistory();
  generating = true;
  setReady(false);
  setStatus(mode === "online" ? "Pensando…" : "Pensando localmente…");

  try {
    const answer = mode === "online" ? await askOnline() : await askLocal();
    assistantBubble.innerHTML = "";
    assistantBubble.appendChild(renderText(answer));
    const body = assistantBubble.parentElement;
    body.appendChild(createTools(answer, assistantBubble.closest(".message"), text));
    history.push({ role: "assistant", content: answer });
    persistHistory();
  } catch (error) {
    assistantBubble.textContent = `No pude responder: ${error.message}`;
    history.pop();
    persistHistory();
  } finally {
    generating = false;
    setReady(true);
    setStatus(mode === "online" ? "IA online lista" : "IA local activa");
    input.focus();
  }
}

async function regenerate(row, userText) {
  if (generating || !userText) return;
  const lastUserIndex = history.map((m) => m.role).lastIndexOf("user");
  if (lastUserIndex >= 0) history = history.slice(0, lastUserIndex);
  persistHistory();
  row.remove();
  await askAI(userText);
}

$("composer").addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || generating) return;
  input.value = "";
  input.style.height = "auto";
  const welcome = $("welcome");
  if (welcome) welcome.remove();
  addMessage("user", text);
  await askAI(text);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 170)}px`;
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    $("composer").requestSubmit();
  }
});

$("settingsBtn").onclick = () => settings.classList.toggle("hidden");

$("saveKey").onclick = () => {
  const value = apiKey.value.trim();
  if (!value) {
    localStorage.removeItem(KEY_NAME);
    setStatus("Clave eliminada");
    return;
  }
  localStorage.setItem(KEY_NAME, value);
  mode = "online";
  modeSelect.value = mode;
  localStorage.setItem(MODE_KEY, mode);
  activateOnline();
};

$("clearKey").onclick = () => {
  localStorage.removeItem(KEY_NAME);
  apiKey.value = "";
  setStatus("Clave borrada");
};

modeSelect.onchange = async () => {
  mode = modeSelect.value;
  localStorage.setItem(MODE_KEY, mode);
  if (mode === "online") await startOnline();
  else await loadLocalAI();
};

$("newChat").onclick = () => {
  speechSynthesis?.cancel?.();
  history = [];
  persistHistory();
  renderSavedChat();
  setStatus(mode === "online" ? "Nuevo chat" : "Nuevo chat local");
};

$("clearChat").onclick = () => {
  history = [];
  persistHistory();
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
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

document.querySelectorAll(".quick-actions button").forEach((button) => {
  button.onclick = () => {
    input.disabled = false;
    input.value = button.dataset.prompt || "";
    input.focus();
    input.dispatchEvent(new Event("input"));
  };
});

themeBtn.onclick = () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
};

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
}

if (history.length) {
  renderSavedChat();
  if (mode === "online" && getKey()) activateOnline();
  else if (mode === "local") loadLocalAI();
  else setReady(false);
} else {
  showWelcome();
  if (mode === "online" && getKey()) activateOnline();
  if (mode === "local") loadLocalAI();
}
