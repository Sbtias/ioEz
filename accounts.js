const ACCOUNT_KEY = "ioEz_account";
const ACCOUNT_ACCOUNTS_KEY = "ioEz_accounts";

const accountButton = document.getElementById("accountBtn");
const accountPanel = document.getElementById("accountPanel");
const accountModal = document.getElementById("accountModal");
const accountTitle = document.getElementById("accountTitle");
const accountSubtitle = document.getElementById("accountSubtitle");
const accountForm = document.getElementById("accountForm");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountPassword = document.getElementById("accountPassword");
const accountSubmit = document.getElementById("accountSubmit");
const accountSwitch = document.getElementById("accountSwitch");
const accountMessage = document.getElementById("accountMessage");
const accountAvatar = document.getElementById("accountAvatar");
const accountAvatarLarge = document.getElementById("accountAvatarLarge");
const accountIdentity = document.getElementById("accountIdentity");
const accountIdentityLarge = document.getElementById("accountIdentityLarge");
const accountEmailLabel = document.getElementById("accountEmailLabel");
const logoutAccount = document.getElementById("logoutAccount");
const closeAccount = document.getElementById("closeAccount");
const closeAccountModal = document.getElementById("closeAccountModal");
const accountModeLabel = document.getElementById("accountModeLabel");

let accountMode = "login";

function loadAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNT_ACCOUNTS_KEY) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch { return []; }
}
function saveAccounts(accounts) { localStorage.setItem(ACCOUNT_ACCOUNTS_KEY, JSON.stringify(accounts)); }
function loadCurrentAccount() { try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null"); } catch { return null; } }
function setMessage(text, error = false) { if (accountMessage) { accountMessage.textContent = text; accountMessage.className = `account-message ${error ? "error" : ""}`; } }
function initials(name) { return String(name || "ioEz").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "IO"; }

function setIdentity(target, name, fallback) { if (target) target.textContent = name || fallback; }
function renderAccount() {
  const account = loadCurrentAccount();
  if (account) {
    const marks = initials(account.name);
    accountButton?.classList.add("signed-in");
    setIdentity(accountIdentity, account.name, "Invitado");
    setIdentity(accountIdentityLarge, account.name, "Invitado");
    if (accountEmailLabel) accountEmailLabel.textContent = account.email || "Sin correo";
    if (accountAvatar) accountAvatar.textContent = marks;
    if (accountAvatarLarge) accountAvatarLarge.textContent = marks;
    if (accountModeLabel) accountModeLabel.textContent = "Cuenta activa";
  } else {
    accountButton?.classList.remove("signed-in");
    setIdentity(accountIdentity, "", "Invitado");
    setIdentity(accountIdentityLarge, "", "Invitado");
    if (accountEmailLabel) accountEmailLabel.textContent = "Sin cuenta";
    if (accountAvatar) accountAvatar.textContent = "✦";
    if (accountAvatarLarge) accountAvatarLarge.textContent = "✦";
    if (accountModeLabel) accountModeLabel.textContent = "Cuenta local";
  }
}

function openAccount(mode = "login") {
  accountMode = mode;
  accountTitle.textContent = mode === "login" ? "Iniciar sesión" : "Crear cuenta";
  accountSubtitle.textContent = mode === "login" ? "Vuelve a tu espacio de ioEz." : "Crea tu perfil para este navegador.";
  accountSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
  accountSwitch.textContent = mode === "login" ? "Crear una cuenta" : "Ya tengo una cuenta";
  accountName.parentElement.style.display = mode === "login" ? "none" : "flex";
  accountPassword.value = "";
  setMessage("");
  accountModal?.classList.remove("hidden");
  accountPanel?.classList.add("hidden");
  setTimeout(() => (mode === "login" ? accountEmail : accountName)?.focus(), 60);
}
function closeModal() { accountModal?.classList.add("hidden"); }
function closePanel() { accountPanel?.classList.add("hidden"); }

accountButton?.addEventListener("click", () => { renderAccount(); accountPanel?.classList.toggle("hidden"); });
document.getElementById("accountLogin")?.addEventListener("click", () => openAccount("login"));
document.getElementById("accountRegister")?.addEventListener("click", () => openAccount("register"));
accountSwitch?.addEventListener("click", () => openAccount(accountMode === "login" ? "register" : "login"));
closeAccount?.addEventListener("click", closePanel);
closeAccountModal?.addEventListener("click", closeModal);
accountModal?.addEventListener("click", event => { if (event.target === accountModal) closeModal(); });
logoutAccount?.addEventListener("click", () => { localStorage.removeItem(ACCOUNT_KEY); renderAccount(); closePanel(); });

accountForm?.addEventListener("submit", event => {
  event.preventDefault();
  const email = accountEmail.value.trim().toLowerCase();
  const password = accountPassword.value;
  const name = accountName.value.trim();
  if (!email || !password || (accountMode === "register" && !name)) { setMessage("Completa todos los campos.", true); return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { setMessage("Escribe un correo válido.", true); return; }
  if (password.length < 6) { setMessage("La contraseña debe tener al menos 6 caracteres.", true); return; }

  const accounts = loadAccounts();
  if (accountMode === "register") {
    if (accounts.some(account => account.email === email)) { setMessage("Ya existe una cuenta con ese correo.", true); return; }
    accounts.push({ name, email, password, createdAt: new Date().toISOString() });
    saveAccounts(accounts);
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ name, email }));
    setMessage("Cuenta creada. Bienvenido a ioEz.");
  } else {
    const account = accounts.find(item => item.email === email && item.password === password);
    if (!account) { setMessage("Correo o contraseña incorrectos.", true); return; }
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ name: account.name, email: account.email }));
    setMessage("Sesión iniciada.");
  }
  renderAccount();
  setTimeout(closeModal, 400);
});

renderAccount();