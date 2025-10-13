// --- Local Storage Helpers ---
const STORAGE_KEY = "taskTrackerData";

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

// --- Helper to safely find badges by header title ---
function getResetBadge(title) {
  const headers = document.querySelectorAll('div.card-header');
  for (const header of headers) {
    const strong = header.querySelector('strong');
    if (strong && strong.textContent.trim() === title) {
      return header.querySelector('.badge');
    }
  }
  return null;
}

// --- Global State ---
let tasks = loadTasks();

// --- Sorting Helper ---
function sortTasksList(list) {
  return list.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

function formatCompletionDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleString(undefined, options);
}

// --- Task Rendering ---
function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = `card mb-3 task-card${task.completed ? " completed" : ""}`;
  card.dataset.id = task.id;

  const body = document.createElement('div');
  body.className = 'card-body';
  const p = document.createElement('p');
  p.className = 'card-text';
  p.textContent = task.text;
  body.appendChild(p);

  card.appendChild(body);

  // Edit + Delete icons
  const editIcon = document.createElement('i');
  editIcon.className = 'bi bi-pencil-square edit-task-button';
  const delIcon = document.createElement('i');
  delIcon.className = 'bi bi-x-square delete-task-button';

  // --- Overlay interaction with edit/delete icons ---
  editIcon.addEventListener('mouseenter', () => {
    const overlay = card.querySelector('.overlay-text');
    if (overlay) overlay.textContent = 'Edit task';
  });
  editIcon.addEventListener('mouseleave', () => {
    const overlay = card.querySelector('.overlay-text');
    if (overlay) {
      overlay.textContent = task.completed
        ? `Completed on ${formatCompletionDate(task.completedAt)}`
        : 'Mark as complete';
    }
  });

  delIcon.addEventListener('mouseenter', () => {
    const overlay = card.querySelector('.overlay-text');
    if (overlay) overlay.textContent = 'Delete task';
  });
  delIcon.addEventListener('mouseleave', () => {
    const overlay = card.querySelector('.overlay-text');
    if (overlay) {
      overlay.textContent = task.completed
        ? `Completed on ${formatCompletionDate(task.completedAt)}`
        : 'Mark as complete';
    }
  });

  card.appendChild(editIcon);
  card.appendChild(delIcon);

  // --- Event handlers ---
  card.addEventListener('click', (e) => {
    if (e.target.closest('.edit-task-button') || e.target.closest('.delete-task-button')) return;
    task.completed = !task.completed;

    // If marking completed, store timestamp
    if (task.completed) {
      const now = new Date();
      task.completedAt = now.toISOString();
    } else {
      delete task.completedAt; // remove timestamp if unmarking
    }

    saveTasks();
    renderTasks();
  });

  editIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(task);
  });

  delIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    tasks = tasks.filter(t => t.id !== task.id);
    saveTasks();
    renderTasks();
  });

  // --- Hover overlay setup ---
  const overlay = document.createElement("div");
  overlay.classList.add("overlay-text");

  if (task.completed && task.completedAt) {
    const completedDate = new Date(task.completedAt);
    const options = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    let formatted = completedDate.toLocaleString(undefined, options);

    // Add ordinal suffix (1st, 2nd, 3rd, etc.)
    const day = completedDate.getDate();
    const suffix =
      (day % 10 === 1 && day !== 11) ? 'st' :
      (day % 10 === 2 && day !== 12) ? 'nd' :
      (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    formatted = formatted.replace(day.toString(), `${day}${suffix}`);

    overlay.textContent = `Completed on ${formatted}`;
  } else {
    overlay.textContent = "Mark as complete";
  }

  card.appendChild(overlay);

  return card;
}


function renderTasks() {
  const dailyBody = document.querySelector('#dailyColumn .card-body');
  const weeklyBody = document.querySelector('#weeklyColumn .card-body');
  const monthlyBody = document.querySelector('#monthlyColumn .card-body');

  dailyBody.innerHTML = '';
  weeklyBody.innerHTML = '';
  monthlyBody.innerHTML = '';

  const dailyTasks = sortTasksList(tasks.filter(t => t.category === 'daily'));
  const weeklyTasks = sortTasksList(tasks.filter(t => t.category === 'weekly'));
  const monthlyTasks = sortTasksList(tasks.filter(t => t.category === 'monthly'));

  dailyTasks.forEach(t => dailyBody.appendChild(createTaskCard(t)));
  weeklyTasks.forEach(t => weeklyBody.appendChild(createTaskCard(t)));
  monthlyTasks.forEach(t => monthlyBody.appendChild(createTaskCard(t)));
}

// --- Add Task ---
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('taskForm');
  const addBtn = form?.querySelector('#addTaskButton');
  const textInput = form?.querySelector('#taskText');
  const priorityRange = form?.querySelector('#priorityRange');
  const priorityValue = form?.querySelector('#priorityValue');

  if (form && addBtn) {
    addBtn.addEventListener('click', () => {
      const text = textInput.value.trim();
      if (!text) return;

      const category = form.querySelector('input[name="taskCategory"]:checked')?.value || 'daily';
      const priority = Number(priorityRange.value) || 1;

      const newTask = {
        id: 't_' + Math.random().toString(36).slice(2, 9),
        text,
        category,
        priority,
        completed: false,
        createdAt: Date.now(),
      };

      tasks.push(newTask);
      saveTasks();
      renderTasks();

      // Reset input field
      textInput.value = '';
      priorityRange.value = 5;
      if (priorityValue) priorityValue.textContent = '5';
    });

    // Slider live update
    priorityRange.addEventListener('input', e => {
      priorityValue.textContent = e.target.value;
    });
  }

  // --- Wilderness toggle (smooth animation logic) ---
  const wildernessLinks = document.querySelectorAll('a.nav-link');
  let wildernessLink = null;

  wildernessLinks.forEach(link => {
    if (link.getAttribute('href') === '#wilderness' || link.textContent.trim() === 'Wilderness Events') {
      wildernessLink = link;
    }
  });

  const wildernessColumn = document.getElementById('wildernessColumn');

  if (wildernessLink && wildernessColumn) {
    const collapseInstance = new bootstrap.Collapse(wildernessColumn, { toggle: false });
    let isOpen = false;
    const taskCols = document.querySelectorAll('#dailyColumn, #weeklyColumn, #monthlyColumn');

    wildernessLink.addEventListener('click', (e) => {
      e.preventDefault();

      if (!isOpen) {
        // Shrink task columns BEFORE wilderness animates in
        taskCols.forEach(col => {
          col.classList.remove('col-md-4');
          col.classList.add('col-md-3');
        });

        collapseInstance.show();
        isOpen = true;
      } else {
        // Hide wilderness column FIRST
        collapseInstance.hide();

        // After animation finishes, expand columns back
        wildernessColumn.addEventListener('hidden.bs.collapse', function handler() {
          taskCols.forEach(col => {
            col.classList.remove('col-md-3');
            col.classList.add('col-md-4');
          });
          wildernessColumn.removeEventListener('hidden.bs.collapse', handler);
        });

        isOpen = false;
      }
    });
  }

  renderTasks();
  startCountdowns();
});

// --- Edit Modal Logic ---
let currentEditTaskId = null;

function openEditModal(task) {
  currentEditTaskId = task.id;
  document.getElementById('editTaskText').value = task.text;
  document.getElementById('editTaskPriority').value = task.priority;
  document.getElementById('editPriorityValue').textContent = task.priority;

  document.querySelectorAll('input[name="editTaskCategory"]').forEach(r => {
    r.checked = r.value === task.category;
  });

  const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
  modal.show();
}

document.getElementById('saveEditTask').addEventListener('click', () => {
  if (!currentEditTaskId) return;

  const task = tasks.find(t => t.id === currentEditTaskId);
  if (!task) return;

  task.text = document.getElementById('editTaskText').value.trim();
  task.priority = Number(document.getElementById('editTaskPriority').value);
  const cat = document.querySelector('input[name="editTaskCategory"]:checked');
  if (cat) task.category = cat.value;

  saveTasks();
  renderTasks();

  const modalEl = document.getElementById('editTaskModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  modalInstance.hide();
});

// === Keyboard shortcuts for the Edit Task modal ===

// Press Enter → Save
const editForm = document.getElementById('editTaskForm');
if (editForm) {
  editForm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('saveEditTask').click();
    }
  });
}

// Press Escape → Cancel / Close modal
document.addEventListener('keydown', (e) => {
  const modalEl = document.getElementById('editTaskModal');
  const isModalVisible = modalEl && modalEl.classList.contains('show');

  if (isModalVisible && e.key === 'Escape') {
    e.preventDefault();
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }
});

document.getElementById('editTaskPriority').addEventListener('input', (e) => {
  document.getElementById('editPriorityValue').textContent = e.target.value;
});

// --- Wilderness Events ---
const WILDERNESS_EVENTS = [
  "Spider Swarm",
  "Unnatural Outcrop",
  "Stryke the Wyrm",
  "Demon Stragglers",
  "Butterfly Swarm",
  "King Black Dragon Rampage",
  "Forgotten Soldiers",
  "Surprising Seedlings",
  "Hellhound Pack",
  "Infernal Star",
  "Lost Souls",
  "Ramokee Incursion",
  "Displaced Energy",
  "Evil Bloodwood Tree"
];

const SPECIAL_EVENTS = [
  "Stryke the Wyrm",
  "King Black Dragon Rampage",
  "Infernal Star",
  "Evil Bloodwood Tree"
];

// --- Reference-based event index calculation ---
// Known reference: on 2025-10-10 22:00 UTC the event was "Evil Bloodwood Tree"
// (Evil Bloodwood Tree is the last item in your WILDERNESS_EVENTS array)
const WILDERNESS_REF_DATE_MS = Date.UTC(2025, 9, 10, 22, 0, 0); // months are 0-based -> 9 = October
const WILDERNESS_REF_INDEX = 13; // index (0-based) of "Evil Bloodwood Tree" in WILDERNESS_EVENTS
const EVENTS_COUNT = WILDERNESS_EVENTS.length; // should be 14

function getCurrentEventIndex() {
  // hours (whole) difference since reference moment
  const hoursSinceRef = Math.floor((Date.now() - WILDERNESS_REF_DATE_MS) / 3600000);
  // advance the known reference index by hoursSinceRef, wrap into [0..EVENTS_COUNT-1]
  const idx = ((WILDERNESS_REF_INDEX + hoursSinceRef) % EVENTS_COUNT + EVENTS_COUNT) % EVENTS_COUNT;
  return idx;
}

function buildWildernessTable() {
  const table = document.getElementById("wildernessTable");
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr>
        <th>Event</th>
        <th>Start</th>
        <th>Countdown</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  updateWildernessTable();
  setInterval(updateWildernessTable, 1000);
}

function updateWildernessTable() {
  const tableBody = document.querySelector("#wildernessTable tbody");
  if (!tableBody) return;

  const utcToggle = document.getElementById("utcToggle");
  const showUTC = utcToggle ? utcToggle.checked : true;

  const now = new Date();
  const currentHourUTC = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentSecond = now.getUTCSeconds();

  const currentEventIndex = getCurrentEventIndex();
  const nextEventIndex = (currentEventIndex + 1) % EVENTS_COUNT;
  const nextEventHour = (currentHourUTC + 1) % 24;

  const events = [];
  for (let i = 0; i < EVENTS_COUNT; i++) {
    const index = (nextEventIndex + i - 7 + EVENTS_COUNT) % EVENTS_COUNT; // center next event
    const startHour = (nextEventHour + i - 7 + 24) % 24;
    events.push({ name: WILDERNESS_EVENTS[index], hour: startHour });
  }

  tableBody.innerHTML = "";

  events.forEach((event, i) => {
    const startTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), event.hour, 0, 0));
    if (startTime < now) startTime.setUTCHours(startTime.getUTCHours() + 24);

    const diff = startTime - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const countdown =
      diff >= 3600000
        ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
        : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    const isNextEvent = i === Math.floor(events.length / 2);

    // Format start time
    let displayTime;
    if (showUTC) {
      displayTime = `${event.hour.toString().padStart(2, "0")}:00`;
    } else {
      // Convert UTC hour to local time
      const localDate = new Date(startTime);
      const localHours = localDate.getHours().toString().padStart(2, "0");
      const localMinutes = localDate.getMinutes().toString().padStart(2, "0");
      displayTime = `${localHours}:${localMinutes}`;
    }

    const tr = document.createElement("tr");
    if (isNextEvent) tr.classList.add("table-success");

    const nameCell = document.createElement("td");
    nameCell.innerHTML = SPECIAL_EVENTS.includes(event.name)
      ? `<strong>${event.name}</strong>`
      : event.name;

    tr.innerHTML = `
      <td align="left">${nameCell.innerHTML}</td>
      <td>${displayTime}</td>
      <td align="right">${countdown}</td>
    `;

    tableBody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const utcToggle = document.getElementById("utcToggle");
  const utcLabel = document.getElementById("utcLabel");
  const taskCreator = document.getElementById("taskCreator");
  const toggleButton = document.getElementById("toggleButton");
  const toggleIcon = toggleButton.querySelector("i");

  // Ensure panel starts collapsed
  const bsCollapse = new bootstrap.Collapse(taskCreator, { toggle: false });
  bsCollapse.hide();
  toggleIcon.classList.remove("bi-chevron-up");
  toggleIcon.classList.add("bi-chevron-down");

  // Listen for collapse events to flip arrow
  taskCreator.addEventListener("shown.bs.collapse", () => {
    toggleIcon.classList.remove("bi-chevron-down");
    toggleIcon.classList.add("bi-chevron-up");
  });

  taskCreator.addEventListener("hidden.bs.collapse", () => {
    toggleIcon.classList.remove("bi-chevron-up");
    toggleIcon.classList.add("bi-chevron-down");
  });
  
  if (!utcToggle || !utcLabel) return;

  // Restore saved state
  const saved = localStorage.getItem("showUTC");
  if (saved !== null) utcToggle.checked = saved === "true";

  // Update label text
  utcLabel.textContent = utcToggle.checked ? "Server Time" : "Local Time";

  utcToggle.addEventListener("change", () => {
    const showUTC = utcToggle.checked;
    localStorage.setItem("showUTC", showUTC);
    utcLabel.textContent = showUTC ? "Server Time" : "Local Time";
    updateWildernessTable(); // instantly refresh display
  });
});

document.addEventListener("DOMContentLoaded", buildWildernessTable);

// --- Countdown Timers ---
function getNextResetUTC(type) {
  const now = new Date();

  if (type === "daily") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  }
  if (type === "weekly") {
    const day = now.getUTCDay(); // Sunday = 0
    const daysUntilWed = (3 - day + 7) % 7 || 7; // next Wednesday
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilWed, 0, 0, 0));
  }
  if (type === "monthly") {
    const nextMonth = now.getUTCMonth() + 1;
    const nextYear = nextMonth > 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
    const month = nextMonth % 12;
    return new Date(Date.UTC(nextYear, month, 1, 0, 0, 0));
  }
}

function formatResetCountdown(diffMs) {
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  if (days >= 1) {
    return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m`;
  } else {
    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  }
}

// --- Helper: reset a category immediately ---
function performCategoryReset(type) {
  let changed = false;
  tasks.forEach(t => {
    if (t.category === type && t.completed) {
      t.completed = false;
      delete t.completedAt;
      changed = true;
    }
  });
  if (changed) {
    saveTasks();
    renderTasks();
  }
}

// --- Countdown update + live reset detection ---
function updateCountdown(type, badgeId) {
  const badge = document.getElementById(badgeId);
  const now = new Date();
  const nextReset = getNextResetUTC(type);
  let diff = nextReset - now;

  // When diff is less than one second (past or exactly at reset), reset tasks
  if (diff <= 1000) {
    performCategoryReset(type);
    diff = getNextResetUTC(type) - now; // recalc to avoid negative
  }

  if (badge) {
    badge.textContent = `Resets in ${formatResetCountdown(diff)}`;
  }
}

// --- Start timers ---
function startCountdowns() {
  // Ensure any outdated completions are cleared at startup
  validateTaskResetsOnLoad();

  // Tick every second, adjust if browser throttles timers
  setInterval(() => {
    updateCountdown("daily", "dailyResetBadge");
    updateCountdown("weekly", "weeklyResetBadge");
    updateCountdown("monthly", "monthlyResetBadge");
  }, 1000);
}

// call this once on load
document.addEventListener("DOMContentLoaded", () => {
  // existing startup logic ...
  renderTasks();
  validateTaskResetsOnLoad(); //check for overdue resets
  startCountdowns();
});