const STORAGE_KEY = "task-journal-v1";
const THEME_KEY = "task-journal-theme-v1";

const form = document.getElementById("journalForm");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const modeSelect = document.getElementById("modeSelect");
const categorySelect = document.getElementById("categorySelect");
const titleInput = document.getElementById("titleInput");
const statusSelect = document.getElementById("statusSelect");
const prioritySelect = document.getElementById("prioritySelect");
const tagsInput = document.getElementById("tagsInput");
const notesInput = document.getElementById("notesInput");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeBtn");
const tableBody = document.getElementById("tableBody");

const filterMode = document.getElementById("filterMode");
const filterStatus = document.getElementById("filterStatus");
const filterPriority = document.getElementById("filterPriority");
const filterToday = document.getElementById("filterToday");

const sumCount = document.getElementById("sumCount");
const sumCompleted = document.getElementById("sumCompleted");
const sumBlocked = document.getElementById("sumBlocked");
const sumDeferred = document.getElementById("sumDeferred");
const sumInProgress = document.getElementById("sumInProgress");

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
    console.error("Error loading journal entries", error);
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

function categoryLabelFromValue(val) {
  const map = {
    work: "Work",
    home: "Home",
    relationship: "Relationship",
    health: "Health / Fitness",
    finance: "Finance / Admin",
    learning: "Learning / Language",
    trading: "Trading",
    mbe: "MBE / Business",
    writing: "Writing / Creative",
    errand: "Errand",
    other: "Other"
  };
  return map[val] || val || "—";
}

function getFilteredEntries(entries) {
  const today = todayISO();

  return entries.filter((entry) => {
    if (filterMode.value !== "all" && entry.mode !== filterMode.value) return false;
    if (filterStatus.value !== "all" && entry.status !== filterStatus.value) return false;
    if (filterPriority.value !== "all" && entry.priority !== filterPriority.value) return false;
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
  let blocked = 0;
  let deferred = 0;
  let inProgress = 0;

  filtered.forEach((entry) => {
    if (entry.status === "done") completed += 1;
    if (entry.status === "blocked") blocked += 1;
    if (entry.status === "deferred") deferred += 1;
    if (entry.status === "in_progress") inProgress += 1;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(entry.date || "")}</td>
      <td>${escapeHtml(entry.time || "—")}</td>
      <td>${escapeHtml(entry.mode || "—")}</td>
      <td>${escapeHtml(entry.categoryLabel || categoryLabelFromValue(entry.category) || "—")}</td>
      <td>${escapeHtml(entry.title || "—")}</td>
      <td>${escapeHtml(entry.status || "—")}</td>
      <td>${escapeHtml(entry.priority || "—")}</td>
      <td>${entry.tags ? `<span class="tag">${escapeHtml(entry.tags)}</span>` : "—"}</td>
      <td class="notes-cell">${escapeHtml(entry.notes || "")}</td>
      <td><button class="btn btn-danger" type="button" data-delete-id="${escapeHtml(entry.id)}">✕</button></td>
    `;
    tableBody.appendChild(tr);
  });

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 10;
    td.className = "empty";
    td.textContent = "No journal entries match the current view.";
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }

  sumCount.textContent = String(filtered.length);
  sumCompleted.textContent = filtered.length ? String(completed) : "–";
  sumBlocked.textContent = filtered.length ? String(blocked) : "–";
  sumDeferred.textContent = filtered.length ? String(deferred) : "–";
  sumInProgress.textContent = filtered.length ? String(inProgress) : "–";

  bindDeleteButtons();
}

function exportCSV() {
  const entries = getFilteredEntries(loadEntries());

  if (!entries.length) {
    alert("No journal entries to export.");
    return;
  }

  const rows = [[
    "date",
    "time",
    "mode",
    "category",
    "task_event",
    "status",
    "priority",
    "tags",
    "notes",
    "created_at"
  ]];

  entries.forEach((entry) => {
    rows.push([
      entry.date || "",
      entry.time || "",
      entry.mode || "",
      entry.categoryLabel || categoryLabelFromValue(entry.category) || "",
      entry.title || "",
      entry.status || "",
      entry.priority || "",
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
  a.download = `task_journal_${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const entries = getFilteredEntries(loadEntries());

  if (!entries.length) {
    alert("No journal entries to export.");
    return;
  }

  const payload = {
    app: "Task Journal",
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
  a.download = `task_journal_${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearAll() {
  if (!confirm("Delete all journal entries? This cannot be undone.")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function handleSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    alert("Please enter a task or event.");
    return;
  }

  const entries = loadEntries();
  entries.push({
    id: String(Date.now() + Math.random()),
    date: dateInput.value || todayISO(),
    time: timeInput.value || "",
    mode: modeSelect.value || "planned",
    category: categorySelect.value || "",
    categoryLabel: categoryLabelFromValue(categorySelect.value || ""),
    title,
    status: statusSelect.value || "done",
    priority: prioritySelect.value || "",
    tags: tagsInput.value.trim(),
    notes: notesInput.value.trim(),
    createdAt: new Date().toISOString()
  });

  saveEntries(entries);

  timeInput.value = "";
  modeSelect.value = "planned";
  categorySelect.value = "";
  titleInput.value = "";
  statusSelect.value = "done";
  prioritySelect.value = "";
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

  filterMode.addEventListener("change", render);
  filterStatus.addEventListener("change", render);
  filterPriority.addEventListener("change", render);
  filterToday.addEventListener("change", render);

  registerServiceWorker();
  render();
});