let currentColumn = null;
let editingTask = null;

// -------------------- Modal Handling --------------------
function openAddModal(column, task = null) {
  currentColumn = column;
  editingTask = task;
  const textBox = document.getElementById('taskText');
  const modalTitle = document.querySelector('.modal-content h3');

  if (task) {
    textBox.value = task.querySelector('.content p').textContent;
    modalTitle.textContent = 'Update Task';
  } else {
    textBox.value = '';
    modalTitle.textContent = 'Add Task';
  }

  document.getElementById('addModal').style.display = 'block';
  setTimeout(() => textBox.focus(), 50);
}

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
  editingTask = null;
}

function saveTask() {
  const text = document.getElementById('taskText').value.trim();
  if (!text) return;

  if (editingTask) {
    editingTask.querySelector('.content p').textContent = text;
    saveAllTasks();
  } else {
    addTask(currentColumn, text, false);
  }
  closeAddModal();
}

// -------------------- Task Handling --------------------
function addTask(column, text, completed = false) {
  const taskContainer = document.getElementById(`${column}-tasks`);
  const task = document.createElement('div');
  task.className = 'task';
  if (completed) task.classList.add('completed');

  task.draggable = true;
  task.addEventListener('dragstart', dragStart);
  task.addEventListener('dragover', dragOver);
  task.addEventListener('drop', dropTask);

  // Task content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content';
  const content = document.createElement('p');
  content.textContent = text;
  contentDiv.appendChild(content);

  // Controls container
  const controls = document.createElement('div');
  controls.className = 'controls';

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon delete';
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-2 14H7L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
    </svg>`;
  deleteBtn.addEventListener('click', () => {
    task.remove();
    saveAllTasks();
  });

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'btn-icon edit';
  editBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
    </svg>`;
  editBtn.addEventListener('click', () => openAddModal(column, task));

  // Complete toggle
  const completeBtn = document.createElement('button');
  completeBtn.className = 'btn-icon complete';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = completed;
  const checkmark = document.createElement('span');
  checkmark.textContent = '✓';
  completeBtn.appendChild(checkbox);
  completeBtn.appendChild(checkmark);

  checkbox.addEventListener('change', () => {
    task.classList.toggle('completed', checkbox.checked);
    saveAllTasks();
  });

  // Append buttons to controls
  controls.appendChild(deleteBtn);
  controls.appendChild(editBtn);
  controls.appendChild(completeBtn);

  // Append everything to task
  task.appendChild(contentDiv);
  task.appendChild(controls);
  taskContainer.appendChild(task);

  saveAllTasks();
}

// -------------------- Drag and Drop --------------------
let draggedTask = null;
function dragStart(e) {
  draggedTask = this;
  e.dataTransfer.effectAllowed = 'move';
  this.classList.add('dragging');
}
function dragOver(e) {
  e.preventDefault();
  const draggingOver = this;
  if (draggedTask === draggingOver) return;

  const bounding = draggingOver.getBoundingClientRect();
  const offset = e.clientY - bounding.top;
  const height = bounding.height;

  if (offset > height / 2) {
    draggingOver.insertAdjacentElement('afterend', draggedTask);
  } else {
    draggingOver.insertAdjacentElement('beforebegin', draggedTask);
  }
}
function dropTask(e) {
  e.preventDefault();
  this.classList.remove('dragging');
  draggedTask.classList.remove('dragging');
  draggedTask = null;
  saveAllTasks();
}

// -------------------- LocalStorage --------------------
function saveAllTasks() {
  const data = {
    dailies: getColumnData('dailies'),
    weeklies: getColumnData('weeklies'),
    monthlies: getColumnData('monthlies')
  };
  localStorage.setItem('taskData', JSON.stringify(data));
}

function getColumnData(column) {
  const tasks = document.getElementById(`${column}-tasks`).children;
  const arr = [];
  for (let task of tasks) {
    const text = task.querySelector('.content p').textContent;
    const completed = task.querySelector('input[type="checkbox"]').checked;
    arr.push({ text, completed });
  }
  return arr;
}

function loadTasks() {
  const saved = localStorage.getItem('taskData');
  if (saved) {
    const data = JSON.parse(saved);
    for (let col of ['dailies', 'weeklies', 'monthlies']) {
      document.getElementById(`${col}-tasks`).innerHTML = '';
      if (data[col]) {
        data[col].forEach(t => addTask(col, t.text, t.completed));
      }
    }
  }
}

// -------------------- Timers --------------------
function updateTimers() {
  document.getElementById('dailies-timer').textContent = getTimeUntilNextUTC('daily');
  document.getElementById('weeklies-timer').textContent = getTimeUntilNextUTC('weekly');
  document.getElementById('monthlies-timer').textContent = getTimeUntilNextUTC('monthly');
}

function getTimeUntilNextUTC(type) {
  const now = new Date();
  let next;

  if (type === 'daily') {
    next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  } else if (type === 'weekly') {
    const day = now.getUTCDay();
    let daysUntilWed = (3 - day + 7) % 7 || 7;
    next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilWed));
  } else {
    next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  }
  next.setUTCHours(0, 0, 0, 0);

  const diff = next - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
}

setInterval(updateTimers, 1000);
updateTimers();

// -------------------- Automatic Resets --------------------
function resetTasks() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcSecond = now.getUTCSeconds();
  const utcDay = now.getUTCDay();
  const utcDate = now.getUTCDate();

  if (utcHour === 0 && utcMinute === 0 && utcSecond === 0) resetColumn('dailies');
  if (utcDay === 3 && utcHour === 0 && utcMinute === 0 && utcSecond === 0) resetColumn('weeklies');
  if (utcDate === 1 && utcHour === 0 && utcMinute === 0 && utcSecond === 0) resetColumn('monthlies');
}

function resetColumn(column) {
  const tasks = document.getElementById(`${column}-tasks`).children;
  for (let task of tasks) {
    const checkbox = task.querySelector('input[type="checkbox"]');
    checkbox.checked = false;
    task.classList.remove('completed');
  }
  saveAllTasks();
}

setInterval(resetTasks, 1000);

// -------------------- Dark Mode Toggle --------------------
document.getElementById('darkToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('darkToggle');
  if (document.body.classList.contains('dark')) {
    btn.textContent = '☀️ Light Mode';
  } else {
    btn.textContent = '🌙 Dark Mode';
  }
});

// -------------------- Initialize --------------------
loadTasks();
