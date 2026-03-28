<!DOCTYPE html>
<html lang="en" data-theme="blue">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Board</title>
  <meta name="description" content="Organizes tasks visually so execution state is visible at a glance." />
  <meta name="theme-color" content="#06101f" />
  <link rel="manifest" href="manifest.json" />
  <link rel="icon" href="../icons/icon-192.png" />
  <link rel="apple-touch-icon" href="../icons/icon-192.png" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app-shell">
    <div class="app">
      <header class="hero card">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Execution System Lite</div>
            <h1>Task Board</h1>
            <p class="subtitle">Organizes tasks visually so execution state is visible at a glance.</p>
          </div>
          <button id="themeBtn" class="btn btn-secondary" type="button" aria-label="Toggle theme">Theme: Blue</button>
        </div>

        <div class="hero-pills">
          <span class="pill">Visual execution layer</span>
          <span class="pill">Board-state clarity</span>
          <span class="pill">Local, fast, exportable</span>
        </div>
      </header>

      <section class="section-card card">
        <div class="section-head section-head-stack">
          <div>
            <div class="eyebrow">Capture</div>
            <h2>Add Board Task</h2>
            <p class="section-copy">Create a task and place it directly into the visual execution flow.</p>
          </div>
        </div>

        <form id="boardForm">
          <div class="form-grid">
            <div class="field">
              <label for="dateInput">Date</label>
              <input type="date" id="dateInput" required />
            </div>

            <div class="field">
              <label for="categorySelect">Category</label>
              <select id="categorySelect">
                <option value="">–</option>
                <option value="work">Work</option>
                <option value="home">Home</option>
                <option value="relationship">Relationship</option>
                <option value="health">Health / Fitness</option>
                <option value="finance">Finance / Admin</option>
                <option value="learning">Learning / Language</option>
                <option value="trading">Trading</option>
                <option value="mbe">MBE / Business</option>
                <option value="writing">Writing / Creative</option>
                <option value="errand">Errand</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="field">
              <label for="prioritySelect">Priority</label>
              <select id="prioritySelect">
                <option value="">–</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div class="field">
              <label for="statusSelect">Board Column</label>
              <select id="statusSelect">
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div class="field field-span-2">
              <label for="titleInput">Task</label>
              <input type="text" id="titleInput" placeholder="e.g., Finish outreach draft, review tracker, plan errands" required />
            </div>

            <div class="field field-span-2">
              <label for="tagsInput">Tags</label>
              <input type="text" id="tagsInput" placeholder="#deepwork #quickwin #admin #errand" />
            </div>

            <div class="field field-full">
              <label for="notesInput">Notes</label>
              <textarea id="notesInput" placeholder="Optional context, blocker, or next step."></textarea>
            </div>
          </div>

          <div class="action-row">
            <button class="btn btn-primary" type="submit">Add Card</button>
            <button class="btn btn-secondary" type="button" id="exportCsvBtn">Export CSV</button>
            <button class="btn btn-secondary" type="button" id="exportJsonBtn">Export JSON</button>
            <button class="btn btn-danger" type="button" id="clearBtn">Clear All</button>
          </div>
        </form>
      </section>

      <section class="metrics-grid">
        <div class="metric-card metric-card-wide">
          <div class="metric-label">Visible Cards</div>
          <div class="metric-value" id="sumCount">0</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Not Started</div>
          <div class="metric-value" id="sumNotStarted">–</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">In Progress</div>
          <div class="metric-value" id="sumInProgress">–</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Blocked</div>
          <div class="metric-value" id="sumBlocked">–</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Done</div>
          <div class="metric-value" id="sumDone">–</div>
        </div>
      </section>

      <section class="section-card card">
        <div class="section-head section-head-stack">
          <div>
            <div class="eyebrow">Filter</div>
            <h2>Board Filters</h2>
            <p class="section-copy">Focus the board by category, priority, or date.</p>
          </div>
        </div>

        <div class="filter-row">
          <div class="filter-field">
            <label for="filterCategory">Category</label>
            <select id="filterCategory">
              <option value="all">All</option>
              <option value="work">Work</option>
              <option value="home">Home</option>
              <option value="relationship">Relationship</option>
              <option value="health">Health / Fitness</option>
              <option value="finance">Finance / Admin</option>
              <option value="learning">Learning / Language</option>
              <option value="trading">Trading</option>
              <option value="mbe">MBE / Business</option>
              <option value="writing">Writing / Creative</option>
              <option value="errand">Errand</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="filter-field">
            <label for="filterPriority">Priority</label>
            <select id="filterPriority">
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div class="checkbox-wrap">
            <label for="filterToday">Today only</label>
            <input type="checkbox" id="filterToday" />
          </div>
        </div>
      </section>

      <section class="board-grid">
        <div class="board-column card">
          <div class="board-column-head">
            <h3>Not Started</h3>
            <span class="board-count" id="countNotStarted">0</span>
          </div>
          <div class="board-stack" id="colNotStarted"></div>
        </div>

        <div class="board-column card">
          <div class="board-column-head">
            <h3>In Progress</h3>
            <span class="board-count" id="countInProgress">0</span>
          </div>
          <div class="board-stack" id="colInProgress"></div>
        </div>

        <div class="board-column card">
          <div class="board-column-head">
            <h3>Blocked</h3>
            <span class="board-count" id="countBlocked">0</span>
          </div>
          <div class="board-stack" id="colBlocked"></div>
        </div>

        <div class="board-column card">
          <div class="board-column-head">
            <h3>Done</h3>
            <span class="board-count" id="countDone">0</span>
          </div>
          <div class="board-stack" id="colDone"></div>
        </div>
      </section>

      <footer class="footer">Task Board • Execution System Lite Companion</footer>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>