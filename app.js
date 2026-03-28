const STORAGE_KEY = "execution-system-lite-v1";
const THEME_KEY = "execution-system-lite-theme-v1";

const form = document.getElementById("taskForm");
const dateInput = document.getElementById("dateInput");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");
const categorySelect = document.getElementById("categorySelect");
const prioritySelect = document.getElementById("prioritySelect");
const taskNameInput = document.getElementById("taskNameInput");
const statusSelect = document.getElementById("statusSelect");
const tagsInput = document.getElementById("tagsInput");
const notesInput = document.getElementById("notesInput");

const exportBtn = document.getElementById("exportBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeBtn");
const tableBody = document.getElementById("tableBody");

const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const filterPriority = document.getElementById("filterPriority");
const filterToday = document.getElementById("filterToday");

const sumCount = document.getElementById("sumCount");
const sumCompleted = document.getElementById("sumCompleted");
const sumCompletionPct = document.getElementById("sumCompletionPct");
const sumActive = document.getElementById("sumActive");
const sumBlocked = document.getElementById("sumBlocked");
const sumOverdue = document.getElementById("sumOverdue");
const sumPlannedVsCompleted = document.getElementById("sumPlannedVsCompleted");
const sumAvgPrio = document.getElementById("sumAvgPrio");

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
    console.error("Error loading entries", error);
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
  return map[val] || val || "";
}

function priorityLabel(val) {
  const map = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical"
  };
  return map[val] || "—";
}

function priorityScore(val) {
  if (val === "low") return 1;
  if (val === "medium") return 2;
  if (val === "high") return 3;
  if (val === "critical") return 4;
  return 0;
}

function timeToMinutes(t) {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function computeDurationMinutes(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start == null || end == null) return null;
  let diff = end - start;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function formatDuration(mins) {
  if (mins == null || Number.isNaN(mins)) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getFilteredEntries(entries) {
  const today = todayISO();

  return entries.filter((entry) => {
    if (filterCategory.value !== "all" && entry.category !== filterCategory.value) return false;
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

function updateEntryStatus(id, value) {
  const entries = loadEntries();
  const idx = entries.findIndex((entry) => entry.id === id);
  if (idx !== -1) {
    entries[idx].status = value;
    saveEntries(entries);
    render();
  }
}

function updateEntryPriority(id, value) {
  const entries = loadEntries();
  const idx = entries.findIndex((entry) => entry.id === id);
  if (idx !== -1) {
    entries[idx].priority = value;
    saveEntries(entries);
    render();
  }
}

function render() {
  const entries = loadEntries().sort((a, b) => {
    const keyA = `${a.date || ""} ${a.startTime || ""}`;
    const keyB = `${b.date || ""} ${b.startTime || ""}`;
    return keyB.localeCompare(keyA);
  });

  const filtered = getFilteredEntries(entries);
  const today = todayISO();

  tableBody.innerHTML = "";

  let completed = 0;
  let active = 0;
  let blocked = 0;
  let overdue = 0;
  let prioSum = 0;
  let prioCount = 0;

  filtered.forEach((entry) => {
    if (entry.status === "done") completed += 1;
    if (entry.status === "blocked") blocked += 1;
    if (entry.status === "not_started" || entry.status === "in_progress") active += 1;
    if (entry.date && entry.date < today && entry.status !== "done") overdue += 1;

    const pScore = priorityScore(entry.priority);
    if (pScore > 0) {
      prioSum += pScore;
      prioCount += 1;
    }

    const tr = document.createElement("tr");
    if (entry.date && entry.date < today && entry.status !== "done") {
      tr.classList.add("overdue-row");
    }

    const durationMinutes = entry.durationMinutes ?? computeDurationMinutes(entry.startTime, entry.endTime);

    tr.innerHTML = `
      <td>${entry.date || ""}</td>
      <td>${entry.startTime || "—"}</td>
      <td>${entry.endTime || "—"}</td>
      <td>${entry.categoryLabel || categoryLabelFromValue(entry.category) || "—"}</td>
      <td>${entry.taskName || "—"}</td>
      <td></td>
      <td></td>
      <td>${formatDuration(durationMinutes)}</td>
      <td>${entry.tags ? `<span class="tag">${entry.tags}</span>` : "—"}</td>
      <td class="notes-cell">${entry.notes || ""}</td>
      <td></td>
    `;

    const prioTd = tr.children[5];
    const prioSel = document.createElement("select");
    prioSel.innerHTML = `
      <option value="">–</option>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
      <option value="critical">Critical</option>
    `;
    prioSel.value = entry.priority || "";
    prioSel.addEventListener("change", () => updateEntryPriority(entry.id, prioSel.value));
    prioTd.appendChild(prioSel);

    const statusTd = tr.children[6];
    const statusSel = document.createElement("select");
    statusSel.innerHTML = `
      <option value="not_started">Not started</option>
      <option value="in_progress">In progress</option>
      <option value="done">Done</option>
      <option value="blocked">Blocked</option>
      <option value="deferred">Deferred</option>
    `;
    statusSel.value = entry.status || "not_started";
    statusSel.addEventListener("change", () => updateEntryStatus(entry.id, statusSel.value));
    statusTd.appendChild(statusSel);

    const delTd = tr.children[10];
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.type = "button";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => deleteEntry(entry.id));
    delTd.appendChild(delBtn);

    tableBody.appendChild(tr);
  });

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 11;
    td.className = "empty";
    td.textContent = "No entries match the current view.";
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }

  const completionPct = filtered.length ? (completed / filtered.length) * 100 : 0;
  const avgPrio = prioCount ? (prioSum / prioCount) : 0;

  sumCount.textContent = String(filtered.length);
  sumCompleted.textContent = filtered.length ? String(completed) : "–";
  sumCompletionPct.textContent = filtered.length ? `${completionPct.toFixed(0)}%` : "–";
  sumActive.textContent = filtered.length ? String(active) : "–";
  sumBlocked.textContent = filtered.length ? String(blocked) : "–";
  sumOverdue.textContent = filtered.length ? String(overdue) : "–";
  sumPlannedVsCompleted.textContent = filtered.length ? `${filtered.length} / ${completed}` : "–";
  sumAvgPrio.textContent = avgPrio ? avgPrio.toFixed(1) : "–";
}

function exportCSV() {
  const entries = getFilteredEntries(loadEntries());

  if (!entries.length) {
    alert("No entries to export.");
    return;
  }

  const rows = [[
    "date",
    "start_time",
    "stop_time",
    "category",
    "task",
    "priority",
    "status",
    "duration_minutes",
    "tags",
    "notes",
    "created_at"
  ]];

  entries.forEach((entry) => {
    rows.push([
      entry.date || "",
      entry.startTime || "",
      entry.endTime || "",
      entry.categoryLabel || categoryLabelFromValue(entry.category) || "",
      entry.taskName || "",
      priorityLabel(entry.priority || ""),
      entry.status || "",
      entry.durationMinutes ?? computeDurationMinutes(entry.startTime, entry.endTime) ?? "",
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
  a.download = `execution_system_lite_${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const entries = getFilteredEntries(loadEntries());

  if (!entries.length) {
    alert("No entries to export.");
    return;
  }

  const payload = {
    app: "Execution System Lite",
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
  a.download = `execution_system_lite_${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearAll() {
  if (!confirm("Delete all entries? This cannot be undone.")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function handleSubmit(event) {
  event.preventDefault();

  const taskName = taskNameInput.value.trim();
  if (!taskName) {
    alert("Please enter a task.");
    return;
  }

  const entries = loadEntries();
  entries.push({
    id: String(Date.now() + Math.random()),
    date: dateInput.value || todayISO(),
    startTime: startTimeInput.value || "",
    endTime: endTimeInput.value || "",
    category: categorySelect.value || "",
    categoryLabel: categoryLabelFromValue(categorySelect.value || ""),
    taskName,
    priority: prioritySelect.value || "",
    status: statusSelect.value || "not_started",
    tags: tagsInput.value.trim(),
    notes: notesInput.value.trim(),
    durationMinutes: computeDurationMinutes(startTimeInput.value || "", endTimeInput.value || ""),
    createdAt: new Date().toISOString()
  });

  saveEntries(entries);

  startTimeInput.value = "";
  endTimeInput.value = "";
  taskNameInput.value = "";
  statusSelect.value = "not_started";
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
  exportBtn.addEventListener("click", exportCSV);
  exportJsonBtn.addEventListener("click", exportJSON);
  clearBtn.addEventListener("click", clearAll);

  filterCategory.addEventListener("change", render);
  filterStatus.addEventListener("change", render);
  filterPriority.addEventListener("change", render);
  filterToday.addEventListener("change", render);

  registerServiceWorker();
  render();
});