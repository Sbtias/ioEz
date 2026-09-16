const UPDATES = [
  {
    version: "v0.0.1",
    date: "16 Sep 2026",
    title: "Beta",
    changes: ["ioEz está actualmente en fase beta."]
  }
];

const list = document.getElementById("updatesList");

function renderUpdates() {
  if (!list) return;
  list.innerHTML = UPDATES.map((update, index) => `
    <article class="update-card ${index === 0 ? "latest" : ""}">
      <div class="update-meta"><span class="update-version">${update.version}</span><span>${update.date}</span>${index === 0 ? '<span class="latest-badge">BETA</span>' : ""}</div>
      <h3>${update.title}</h3>
      <ul>${update.changes.map(change => `<li>${change}</li>`).join("")}</ul>
    </article>
  `).join("");
}

renderUpdates();

const updatesPanel = document.getElementById("updatesPanel");
document.getElementById("updatesBtn")?.addEventListener("click", () => updatesPanel?.classList.toggle("hidden"));
document.getElementById("closeUpdates")?.addEventListener("click", () => updatesPanel?.classList.add("hidden"));