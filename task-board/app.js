const STORAGE_KEY = "task-board-v1";
const THEME_KEY = "task-board-theme-v1";

const form = document.getElementById("boardForm");
const dateInput = document.getElementById("dateInput");
const categorySelect = document.getElementById("categorySelect");
const prioritySelect = document.getElementById("prioritySelect");
const statusSelect = document.getElementById("statusSelect");
const titleInput = document.getElementById("titleInput");
const tagsInput = document.getElementById("tagsInput");
const notesInput = document.getElementById("notesInput");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeBtn");

const filterCategory = document.getElementById("filterCategory");
const filterPriority = document.getElementById("filterPriority");
const filterToday = document.getElementById("filterToday");

const colNotStarted = document.getElementById("colNotStarted");
const colInProgress = document.getElementById("colInProgress");
const colBlocked = document.getElementById("colBlocked");
const colDone = document.getElementById("colDone");

const countNotStarted = document.getElementById("countNotStarted");
const countInProgress = document.getElementById("countInProgress");
const countBlocked = document.getElementById("countBlocked");
const countDone = document.getElementById("countDone");

const sumCount = document.getElementById("sumCount");
const sumNotStarted = document.getElementById("sumNotStarted");
const sumInProgress = document.getElementById("sumInProgress");
const sumBlocked = document.getElementById("sumBlocked");
const sumDone = document.getElementById("sumDone");

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
    console.error("Error loading board entries", error);
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

function priorityClass(priority) {
  if (priority === "low") return "prio-low";
  if (priority === "medium") return "prio-medium";
  if (priority === "high") return "prio-high";
  if (priority === "critical") return "prio-critical";
  return "";
}

function getFilteredEntries(entries) {
  const today = todayISO();

  return entries.filter((entry) => {
    if (filterCategory.value !== "all" && entry.category !== filterCategory.value) return false;
    if (filterPriority.value !== "all" && entry.priority !== filterPriority.value) return false;
    if (filterToday.checked && entry.date !== today) return false;
    return true;
  });
}

function moveEntry(id, nextStatus) {
  const entries = loadEntries();
  const idx = entries.findIndex((entry) => entry.id === id);
  if (idx !== -1) {
    entries[idx].status = nextStatus;
    saveEntries(entries);
    render();
  }
}

function deleteEntry(id) {
  const entries = loadEntries().filter((entry) => entry.id !== id);
  saveEntries(entries);
  render();
}

function createActionButton(label, handler, className = "btn") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener("click", handler);
  return btn;
}

function buildCard(entry) {
  const card = document.createElement("article");
  card.className = "board-card";

  const head = document.createElement("div");
  head.className = "board-card-head";

  const title = document.createElement("div");
  title.className = "board-card-title";
  title.textContent = entry.title || "Untitled";

  const dateChip = document.createElement("div");
  dateChip.className = "board-chip";
  dateChip.textContent = entry.date || "—";

  head.appendChild(title);
  head.appendChild(dateChip);

  const meta = document.createElement("div");
  meta.className = "board-meta";

  const categoryChip = document.createElement("span");
  categoryChip.className = "board-chip";
  categoryChip.textContent = categoryLabelFromValue(entry.category);

  const priorityChip = document.createElement("span");
  priorityChip.className = `board-chip ${priorityClass(entry.priority)}`.trim();
  priorityChip.textContent = entry.priority
    ? entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)
    : "No Priority";

  meta.appendChild(categoryChip);
  meta.appendChild(priorityChip);

  if (entry.tags) {
    const tagsChip = document.createElement("span");
    tagsChip.className = "board-chip";
    tagsChip.textContent = entry.tags;
    meta.appendChild(tagsChip);
  }

  const notes = document.createElement("div");
  notes.className = "board-notes";
  notes.textContent = entry.notes || "No notes";

  const actions = document.createElement("div");
  actions.className = "board-actions";

  if (entry.status !== "not_started") {
    actions.appendChild(
      createActionButton("← Back", () => {
        const prev = {
          in_progress: "not_started",
          blocked: "in_progress",
          done: "in_progress"
        };
        moveEntry(entry.id, prev[entry.status] || "not_started");
      })
    );
  }

  if (entry.status === "not_started") {
    actions.appendChild(createActionButton("Start", () => moveEntry(entry.id, "in_progress"), "btn btn-primary"));
  }

  if (entry.status === "in_progress") {
    actions.appendChild(createActionButton("Block", () => moveEntry(entry.id, "blocked")));
    actions.appendChild(createActionButton("Done", () => moveEntry(entry.id, "done"), "btn btn-primary"));
  }

  if (entry.status === "blocked") {
    actions.appendChild(createActionButton("Resume", () => moveEntry(entry.id, "in_progress"), "btn btn-primary"));
    actions.appendChild(createActionButton("Done", () => moveEntry(entry.id, "done")));
  }

  if (entry.status === "done") {
    actions.appendChild(createActionButton("Reopen", () => moveEntry(entry.id, "in_progress")));
  }

  actions.appendChild(createActionButton("Delete", () => deleteEntry(entry.id), "btn btn-danger"));

  card.appendChild(head);
  card.appendChild(meta);
  card.appendChild(notes);
  card.appendChild(actions);

  return card;
}

function renderColumn(container, entries) {
  container.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "board-empty";
    empty.textContent = "No cards in this column.";
    container.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    container.appendChild(buildCard(entry));
  });
}

function render() {
  const entries = loadEntries().sort((a, b) => {
    const keyA = `${a.date || ""} ${a.createdAt || ""}`;
    const keyB = `${b.date || ""} ${b.createdAt || ""}`;
    return keyB.localeCompare(keyA);
  });

  const filtered = getFilteredEntries(entries);

  const notStarted = filtered.filter((entry) => entry.status === "not_started");
  const inProgress = filtered.filter((entry) => entry.status === "in_progress");
  const blocked = filtered.filter((entry) => entry.status === "blocked");
  const done = filtered.filter((entry) => entry.status === "done");

  renderColumn(colNotStarted, notStarted);
  renderColumn(colInProgress, inProgress);
  renderColumn(colBlocked, blocked);
  renderColumn(colDone, done);

  countNotStarted.textContent = String(notStarted.length);
  countInProgress.textContent = String(inProgress.length);
  countBlocked.textContent = String(blocked.length);
  countDone.textContent = String(done.length);

  sumCount.textContent = String(filtered.length);
  sumNotStarted.textContent = filtered.length ? String(notStarted.length) : "–";
  sumInProgress.textContent = filtered.length ? String(inProgress.length) : "–";
  sumBlocked.textContent = filtered.length ? String(blocked.length) : "–";
  sumDone.textContent = filtered.length ? String(done.length) : "–";
}

function exportCSV() {
  const entries = getFilteredEntries(loadEntries());

  if (!entries.length) {
    alert("No board cards to export.");
    return;
  }

  const rows = [[
    "date",
    "category",
    "priority",
    "status",
    "task",
    "tags",
    "notes",
    "created_at"
  ]];

  entries.forEach((entry) => {
    rows.push([
      entry.date || "",
      entry.category || "",
      entry.priority || "",
      entry.status || "",
      entry.title || "",
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
  a.download = `task_board_${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const entries = getFilteredEntries(loadEntries());

  if (!entries.length) {
    alert("No board cards to export.");
    return;
  }

  const payload = {
    app: "Task Board",
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
  a.download = `task_board_${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearAll() {
  if (!confirm("Delete all board cards? This cannot be undone.")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function handleSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    alert("Please enter a task.");
    return;
  }

  const entries = loadEntries();
  entries.push({
    id: String(Date.now() + Math.random()),
    date: dateInput.value || todayISO(),
    category: categorySelect.value || "",
    priority: prioritySelect.value || "",
    status: statusSelect.value || "not_started",
    title,
    tags: tagsInput.value.trim(),
    notes: notesInput.value.trim(),
    createdAt: new Date().toISOString()
  });

  saveEntries(entries);

  categorySelect.value = "";
  prioritySelect.value = "";
  statusSelect.value = "not_started";
  titleInput.value = "";
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

  filterCategory.addEventListener("change", render);
  filterPriority.addEventListener("change", render);
  filterToday.addEventListener("change", render);

  registerServiceWorker();
  render();
});