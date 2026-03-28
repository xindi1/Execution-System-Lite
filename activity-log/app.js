const STORAGE_KEY = "activity-log-v1";
const THEME_KEY = "activity-log-theme-v1";

const form = document.getElementById("activityForm");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const typeSelect = document.getElementById("typeSelect");
const statusSelect = document.getElementById("statusSelect");
const roleInput = document.getElementById("roleInput");
const titleInput = document.getElementById("titleInput");
const locationInput = document.getElementById("locationInput");
const peopleInput = document.getElementById("peopleInput");
const costInput = document.getElementById("costInput");
const ratingInput = document.getElementById("ratingInput");
const tagsInput = document.getElementById("tagsInput");
const notesInput = document.getElementById("notesInput");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeBtn");
const tableBody = document.getElementById("tableBody");

const filterType = document.getElementById("filterType");
const filterStatus = document.getElementById("filterStatus");
const filterRating = document.getElementById("filterRating");
const filterToday = document.getElementById("filterToday");

const sumCount = document.getElementById("sumCount");
const sumCompleted = document.getElementById("sumCompleted");
const sumPlanned = document.getElementById("sumPlanned");
const sumRating = document.getElementById("sumRating");
const sumCost = document.getElementById("sumCost");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading activity entries", error);
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.textContent = `Theme: ${theme === "blue" ? "Blue" : "Light"}`;
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "blue";
  applyTheme(saved);

  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "blue";
    applyTheme(current === "blue" ? "light" : "blue");
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function currency(value) {
  if (value === "" || value == null || Number.isNaN(Number(value))) return "—";
  return `$${Number(value).toFixed(2)}`;
}

function getFilteredEntries(entries) {
  const today = todayISO();

  return entries.filter((entry) => {
    if (filterType.value !== "all" && entry.type !== filterType.value) return false;
    if (filterStatus.value !== "all" && entry.status !== filterStatus.value) return false;

    if (filterRating.value === "rated" && !entry.rating) return false;
    if (["1", "2", "3", "4", "5"].includes(filterRating.value) && String(entry.rating || "") !== filterRating.value) {
      return false;
    }

    if (filterToday.checked && entry.date !== today) return false;

    return true;
  });
}

function deleteEntry(id) {
  const entries = loadEntries().filter((entry) => entry.id !== id);
  saveEntries(entries);
  render();
}

function bindDeleteButtons() {
  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteEntry(button.getAttribute("data-delete-id"));
    });
  });
}

function render() {
  const entries = loadEntries().sort((a, b) => {
    const keyA = `${a.date || ""} ${a.time || ""}`;
    const keyB = `${b.date || ""} ${b.time || ""}`;
    return keyB.localeCompare(keyA);
  });

  const filtered = getFilteredEntries(entries);
  tableBody.innerHTML = "";

  let completed = 0;
  let planned = 0;
  let ratingTotal = 0;
  let ratingCount = 0;
  let costTotal = 0;

  filtered.forEach((entry) => {
    if (entry.status === "completed") completed += 1;
    if (entry.status === "planned") planned += 1;

    if (entry.rating) {
      ratingTotal += Number(entry.rating);
      ratingCount += 1;
    }

    if (entry.cost !== "" && entry.cost != null && !Number.isNaN(Number(entry.cost))) {
      costTotal += Number(entry.cost);
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(entry.date || "")}</td>
      <td>${escapeHtml(entry.time || "—")}</td>
      <td>${escapeHtml(entry.type || "—")}</td>
      <td>${escapeHtml(entry.status || "—")}</td>
      <td>${escapeHtml(entry.role || "—")}</td>
      <td>${escapeHtml(entry.title || "—")}</td>
      <td>${escapeHtml(entry.location || "—")}</td>
      <td>${escapeHtml(entry.people || "—")}</td>
      <td>${entry.cost !== "" && entry.cost != null ? currency(entry.cost) : "—"}</td>
      <td>${escapeHtml(entry.rating || "—")}</td>
      <td>${entry.tags ? `<span class="tag">${escapeHtml(entry.tags)}</span>` : "—"}</td>
      <td class="notes-cell">${escapeHtml(entry.notes || "")}</td>
      <td><button class="btn btn-danger" type="button" data-delete-id="${escapeHtml(entry.id)}">✕</button></td>
    `;
    tableBody.appendChild(tr);
  });

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 13;
    td.className = "empty";
    td.textContent = "No activity entries match the current view.";
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }

  sumCount.textContent = String(filtered.length);
  sumCompleted.textContent = filtered.length ? String(completed) : "–";
  sumPlanned.textContent = filtered.length ? String(planned) : "–";
  sumRating.textContent = ratingCount ? (ratingTotal / ratingCount).toFixed(1) : "–";
  sumCost.textContent = filtered.length ? currency(costTotal) : "–";

  bindDeleteButtons();
}

function exportCSV() {
  const entries = getFilteredEntries(loadEntries());

  if (!entries.length) {
    alert("No activity entries to export.");
    return;
  }

  const rows = [[
    "date",
    "time",
    "type",
    "status",
    "role",
    "activity",
    "location",
    "people",
    "cost",
    "rating",
    "tags",
    "notes",
    "created_at"
  ]];

  entries.forEach((entry) => {
    rows.push([
      entry.date || "",
      entry.time || "",
      entry.type || "",
      entry.status || "",
      entry.role || "",
      entry.title || "",
      entry.location || "",
      entry.people || "",
      entry.cost || "",
      entry.rating || "",
      entry.tags || "",
      entry.notes || "",
      entry.createdAt || ""
    ]);
  });

  const csv = rows.map((row) =>
    row.map((cell) => {
      const s = String(cell);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity_log_${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const entries = getFilteredEntries(loadEntries());

  if (!entries.length) {
    alert("No activity entries to export.");
    return;
  }

  const payload = {
    app: "Activity Log",
    exportedAt: new Date().toISOString(),
    entryCount: entries.length,
    entries
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity_log_${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearAll() {
  if (!confirm("Delete all activity entries? This cannot be undone.")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function handleSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    alert("Please enter an activity.");
    return;
  }

  const entries = loadEntries();
  entries.push({
    id: String(Date.now() + Math.random()),
    date: dateInput.value || todayISO(),
    time: timeInput.value || "",
    type: typeSelect.value || "",
    status: statusSelect.value || "completed",
    role: roleInput.value.trim(),
    title,
    location: locationInput.value.trim(),
    people: peopleInput.value.trim(),
    cost: costInput.value !== "" ? Number(costInput.value).toFixed(2) : "",
    rating: ratingInput.value || "",
    tags: tagsInput.value.trim(),
    notes: notesInput.value.trim(),
    createdAt: new Date().toISOString()
  });

  saveEntries(entries);

  timeInput.value = "";
  typeSelect.value = "";
  statusSelect.value = "completed";
  roleInput.value = "";
  titleInput.value = "";
  locationInput.value = "";
  peopleInput.value = "";
  costInput.value = "";
  ratingInput.value = "";
  tagsInput.value = "";
  notesInput.value = "";

  render();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  dateInput.value = todayISO();
  initTheme();

  form.addEventListener("submit", handleSubmit);
  exportCsvBtn.addEventListener("click", exportCSV);
  exportJsonBtn.addEventListener("click", exportJSON);
  clearBtn.addEventListener("click", clearAll);

  filterType.addEventListener("change", render);
  filterStatus.addEventListener("change", render);
  filterRating.addEventListener("change", render);
  filterToday.addEventListener("change", render);

  registerServiceWorker();
  render();
});