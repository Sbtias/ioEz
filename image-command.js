const AVATAR_KEY = "ioEz_avatar";
const HISTORY_KEY = "ioEz_history";
const WIKI_API = "https://commons.wikimedia.org/w/api.php";

const $ = id => document.getElementById(id);

function cleanQuery(value) {
  const aliases = {
    spiderman: "Spider-Man",
    "spider man": "Spider-Man",
    "hombre araña": "Spider-Man",
    "hombre arana": "Spider-Man"
  };
  const key = value.toLowerCase().trim();
  return (aliases[key] || value).replace(/\s+/g, " ").replace(/[.!?]+$/, "").trim().slice(0, 90);
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function saveHistory(role, content) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    history.push({ role, content });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40)));
  } catch {}
}

function putAvatar(url) {
  localStorage.setItem(AVATAR_KEY, url);
  document.querySelectorAll(".avatar, .welcome-icon").forEach(element => {
    element.classList.add("has-image");
    element.innerHTML = `<img src="${escapeAttr(url)}" alt="Perfil de ioEz">`;
  });
  const preview = $("profilePreview");
  if (preview) {
    preview.src = url;
    preview.style.display = "block";
  }
}

function renderUser(text) {
  const messages = $("messages");
  const row = document.createElement("div");
  row.className = "message user";
  const body = document.createElement("div");
  body.className = "message-body";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  body.appendChild(bubble);
  row.appendChild(body);
  messages.appendChild(row);
}

function renderImageResponse(text, result, subject) {
  const messages = $("messages");
  const row = document.createElement("div");
  row.className = "message assistant";

  const avatar = document.createElement("div");
  avatar.className = "avatar has-image";
  avatar.innerHTML = `<img src="${escapeAttr(result.url)}" alt="Perfil de ioEz">`;

  const body = document.createElement("div");
  body.className = "message-body";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const p = document.createElement("div");
  p.textContent = text;
  bubble.appendChild(p);

  const img = document.createElement("img");
  img.className = "image-result avatar-preview";
  img.src = result.url;
  img.alt = result.title || subject;
  img.loading = "lazy";
  bubble.appendChild(img);

  const caption = document.createElement("small");
  caption.className = "image-caption";
  caption.textContent = result.title || "Imagen encontrada en Wikimedia Commons";
  bubble.appendChild(caption);

  body.appendChild(bubble);
  row.append(avatar, body);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

async function searchCommons(query) {
  const searches = [`intitle:"${query}"`, query];

  for (const search of searches) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: search,
      gsrnamespace: "6",
      gsrlimit: "10",
      prop: "imageinfo",
      iiprop: "url|mime|size",
      iiurlwidth: "900",
      format: "json",
      origin: "*"
    });

    const response = await fetch(`${WIKI_API}?${params}`);
    if (!response.ok) continue;

    const data = await response.json();
    const pages = Object.values(data?.query?.pages || {});
    const results = pages
      .map(page => ({
        title: String(page.title || "").replace(/^File:/, ""),
        url: page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url,
        mime: page.imageinfo?.[0]?.mime || ""
      }))
      .filter(item => item.url && item.mime.startsWith("image/") && !/\.svg$/i.test(item.url));

    if (results.length) return results;
  }

  return [];
}

function parseProfileCommand(text) {
  const patterns = [
    /^(?:oye\s+)?ponte\s+(?:una\s+)?(?:imagen|foto)\s+(?:de|del|de la)\s+(.+)$/i,
    /^(?:oye\s+)?pon\s+(?:una\s+)?(?:imagen|foto)\s+(?:de|del|de la)\s+(.+)$/i,
    /^(?:oye\s+)?usa\s+(?:una\s+)?(?:imagen|foto)\s+(?:de|del|de la)\s+(.+)\s+(?:como\s+)?(?:tu\s+)?(?:avatar|foto\s+de\s+perfil)$/i,
    /^(?:oye\s+)?cambia\s+(?:tu\s+)?(?:avatar|foto|imagen)(?:\s+de\s+perfil)?\s+(?:a|por)\s+(?:una\s+)?(?:imagen|foto)\s+(?:de|del|de la)\s+(.+)$/i,
    /^(?:oye\s+)?pon\s+(?:como\s+)?(?:avatar|foto\s+de\s+perfil)\s+(?:una\s+)?(?:imagen|foto)\s+(?:de|del|de la)\s+(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = text.trim().match(pattern);
    if (match?.[1]) return cleanQuery(match[1]);
  }

  return null;
}

async function setProfileFromChat(text, subject) {
  const messages = $("messages");
  $("welcome")?.remove();
  renderUser(text);
  saveHistory("user", text);

  const loading = document.createElement("div");
  loading.className = "message assistant";
  loading.innerHTML = `<div class="avatar">Ø</div><div class="message-body"><div class="bubble">Buscando una imagen de <strong>${escapeAttr(subject)}</strong>…</div></div>`;
  messages.appendChild(loading);
  messages.scrollTop = messages.scrollHeight;

  try {
    const results = await searchCommons(subject);
    loading.remove();

    if (!results.length) {
      const row = document.createElement("div");
      row.className = "message assistant";
      row.innerHTML = `<div class="avatar">Ø</div><div class="message-body"><div class="bubble">No encontré una imagen utilizable de “${escapeAttr(subject)}”. Prueba con otro nombre.</div></div>`;
      messages.appendChild(row);
      saveHistory("assistant", `No encontré una imagen de ${subject}.`);
      return;
    }

    const selected = results[0];
    putAvatar(selected.url);
    renderImageResponse(`Listo. Encontré una imagen de ${subject} y ahora es mi foto de perfil.`, selected, subject);
    saveHistory("assistant", `Foto de perfil cambiada a una imagen de ${subject}.`);
  } catch (error) {
    loading.remove();
    const row = document.createElement("div");
    row.className = "message assistant";
    row.innerHTML = `<div class="avatar">Ø</div><div class="message-body"><div class="bubble">No pude buscar esa imagen ahora mismo.</div></div>`;
    messages.appendChild(row);
    saveHistory("assistant", "No pude buscar la imagen ahora mismo.");
  }
}

function restoreProfilePreview() {
  const url = localStorage.getItem(AVATAR_KEY);
  const preview = $("profilePreview");
  if (url && preview) {
    preview.src = url;
    preview.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("composer");
  const input = $("input");

  restoreProfilePreview();

  $("profileInput")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => putAvatar(reader.result);
    reader.readAsDataURL(file);
  });

  $("removeProfile")?.addEventListener("click", () => {
    localStorage.removeItem(AVATAR_KEY);
    const preview = $("profilePreview");
    if (preview) {
      preview.removeAttribute("src");
      preview.style.display = "none";
    }
    document.querySelectorAll(".avatar, .welcome-icon").forEach(element => {
      element.classList.remove("has-image");
      element.innerHTML = "Ø";
    });
  });

  form?.addEventListener("submit", event => {
    const text = input?.value?.trim() || "";
    const subject = parseProfileCommand(text);
    if (!subject) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    input.value = "";
    input.style.height = "auto";
    void setProfileFromChat(text, subject);
  }, true);
});
