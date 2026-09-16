const CREDITS_KEY = "ioEz_credits";
const CREDIT_TIME_KEY = "ioEz_credits_last_tick";
const MAX_CREDITS = 100;
const REGEN_AMOUNT = 10;
const REGEN_INTERVAL = 5 * 60 * 1000;

let credits = Number(localStorage.getItem(CREDITS_KEY));
if (!Number.isFinite(credits)) credits = 100;

let lastTick = Number(localStorage.getItem(CREDIT_TIME_KEY));
if (!Number.isFinite(lastTick)) lastTick = Date.now();

function reconcileCredits() {
  const now = Date.now();
  const elapsed = now - lastTick;
  const periods = Math.max(0, Math.floor(elapsed / REGEN_INTERVAL));
  if (periods > 0) {
    credits = Math.min(MAX_CREDITS, credits + periods * REGEN_AMOUNT);
    lastTick += periods * REGEN_INTERVAL;
  }
  if (credits >= MAX_CREDITS) lastTick = now;
  persistCredits();
}

function persistCredits() {
  localStorage.setItem(CREDITS_KEY, String(Math.max(0, Math.round(credits))));
  localStorage.setItem(CREDIT_TIME_KEY, String(lastTick));
  renderCredits();
}

function estimateCost(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return 0;

  let cost = 1;
  const words = value.split(/\s+/).length;
  if (words > 25) cost += 1;
  if (words > 60) cost += 1;
  if (words > 120) cost += 1;
  if (words > 220) cost += 1;

  const complexitySignals = [
    "programa", "programa", "código", "codigo", "debug", "error", "arquitectura",
    "explica en detalle", "paso a paso", "compara", "analiza", "investiga", "razona",
    "matemática", "matematica", "algoritmo", "optimiza", "optimización", "optimización",
    "minecraft mod", "unity", "roblox", "javascript", "python", "html", "css", "sql"
  ];
  cost += complexitySignals.filter(signal => value.includes(signal)).length > 0 ? 1 : 0;
  if (/```|código|codigo|script|función|funcion|clase\b/.test(value)) cost += 1;
  if (/[?].*[?]/.test(value)) cost += 1;

  return Math.min(8, Math.max(1, cost));
}

function renderCredits() {
  const display = document.getElementById("creditsDisplay");
  const next = document.getElementById("creditsNext");
  if (display) display.textContent = `${credits} créditos`;

  if (next) {
    const remaining = Math.max(0, REGEN_INTERVAL - (Date.now() - lastTick));
    if (credits >= MAX_CREDITS) next.textContent = "Máximo";
    else {
      const seconds = Math.ceil(remaining / 1000);
      const min = Math.floor(seconds / 60);
      const sec = String(seconds % 60).padStart(2, "0");
      next.textContent = `+10 en ${min}:${sec}`;
    }
  }
}

function spendCredits(amount) {
  if (credits < amount) return false;
  credits -= amount;
  persistCredits();
  return true;
}

function showCreditMessage(text) {
  const messages = document.getElementById("messages");
  if (!messages) return;
  const row = document.createElement("div");
  row.className = "message assistant credit-notice";
  row.innerHTML = `<div class="avatar">✦</div><div class="message-body"><div class="bubble"></div></div>`;
  row.querySelector(".bubble").textContent = text;
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

reconcileCredits();
renderCredits();

setInterval(() => {
  reconcileCredits();
  renderCredits();
}, 1000);

const composer = document.getElementById("composer");
composer?.addEventListener("submit", event => {
  reconcileCredits();
  const input = document.getElementById("input");
  const cost = estimateCost(input?.value || "");
  if (!cost) return;

  if (!spendCredits(cost)) {
    event.preventDefault();
    showCreditMessage("No tienes suficientes créditos. ioEz genera 10 créditos cada 5 minutos. Espera un poco o usa una pregunta menos costosa.");
    return;
  }

  const display = document.getElementById("creditsDisplay");
  if (display) {
    display.classList.remove("credits-spent");
    void display.offsetWidth;
    display.classList.add("credits-spent");
  }
}, true);

window.ioEzCredits = {
  get balance() { return credits; },
  get max() { return MAX_CREDITS; },
  estimateCost,
  spend: spendCredits,
  refresh: reconcileCredits
};