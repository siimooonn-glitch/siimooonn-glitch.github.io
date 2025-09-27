let currentColumn = null;

// -------------------- Modal Handling --------------------
function openAddModal(column) {
  currentColumn = column;
  document.getElementById('taskText').value = '';
  document.getElementById('addModal').style.display = 'block';
}

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
}

function saveTask() {
  const text = document.getElementById('taskText').value.trim();
  if (text !== '') {
    addTask(currentColumn, text, false);
    closeAddModal();
  }
}

// -------------------- Task Handling --------------------
// -------------------- Task Handling --------------------
function addTask(column, text, completed = false) {
  const taskContainer = document.getElementById(`${column}-tasks`);
  const task = document.createElement('div');
  task.className = 'task';
  if (completed) task.classList.add('completed');

  // make draggable
  task.draggable = true;
  task.addEventListener('dragstart', dragStart);
  task.addEventListener('dragover', dragOver);
  task.addEventListener('drop', dropTask);

  // delete button top right
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete';
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-2 14H7L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
    </svg>
  `;
  deleteBtn.addEventListener('click', () => {
    task.remove();
    saveAllTasks();
  });

  // content text
  const content = document.createElement('p');
  content.textContent = text;

  // complete checkbox bottom right
  const completeContainer = document.createElement('div');
  completeContainer.className = 'complete-container';

  const completeLabel = document.createElement('span');
  completeLabel.style.display = completed ? 'inline' : 'none';
  completeLabel.textContent = 'Completed';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = completed;
  checkbox.addEventListener('change', () => {
    task.classList.toggle('completed', checkbox.checked);
    completeLabel.style.display = checkbox.checked ? 'inline' : 'none';
    saveAllTasks();
  });

  completeContainer.appendChild(completeLabel);
  completeContainer.appendChild(checkbox);

  // append everything
  task.appendChild(deleteBtn);
  task.appendChild(content);
  task.appendChild(completeContainer);

  taskContainer.appendChild(task);

  // Save after adding
  saveAllTasks();
}

// -------------------- Drag and Drop --------------------
let draggedTask = null;

function dragStart(e) {
  draggedTask = this; // the task being dragged
  e.dataTransfer.effectAllowed = 'move';
  // visually indicate dragging
  this.classList.add('dragging');
}

function dragOver(e) {
  e.preventDefault(); // allow drop
  const taskList = this.parentElement;
  const draggingOver = this;
  if (draggedTask === draggingOver) return;

  // figure out where to insert
  const bounding = draggingOver.getBoundingClientRect();
  const offset = e.clientY - bounding.top;
  const height = bounding.height;

  if (offset > height / 2) {
    // below
    draggingOver.insertAdjacentElement('afterend', draggedTask);
  } else {
    // above
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
    const text = task.querySelector('p').textContent;
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
  document.getElementById('dailies-timer').textContent = getTimeUntilNextUTC(0, 'daily');
  document.getElementById('weeklies-timer').textContent = getTimeUntilNextUTC(0, 'weekly');
  document.getElementById('monthlies-timer').textContent = getTimeUntilNextUTC(0, 'monthly');
}

function getTimeUntilNextUTC(hour, type) {
  const now = new Date();
  let next = new Date(now);

  if (type === 'daily') {
    next.setUTCDate(now.getUTCDate() + 1);
    next.setUTCHours(0, 0, 0, 0);
  } else if (type === 'weekly') {
    const day = now.getUTCDay();
    let daysUntilWednesday = (3 - day + 7) % 7;
    if (daysUntilWednesday === 0) daysUntilWednesday = 7;
    next.setUTCDate(now.getUTCDate() + daysUntilWednesday);
    next.setUTCHours(0, 0, 0, 0);
  } else if (type === 'monthly') {
    next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  }

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
  const utcDay = now.getUTCDay();
  const utcDate = now.getUTCDate();

  if (utcHour === 0 && now.getUTCMinutes() === 0 && now.getUTCSeconds() === 0) {
    resetColumn('dailies');
  }
  if (utcDay === 3 && utcHour === 0 && now.getUTCMinutes() === 0 && now.getUTCSeconds() === 0) {
    resetColumn('weeklies');
  }
  if (utcDate === 1 && utcHour === 0 && now.getUTCMinutes() === 0 && now.getUTCSeconds() === 0) {
    resetColumn('monthlies');
  }
}

function resetColumn(column) {
  const tasks = document.getElementById(`${column}-tasks`).children;
  for (let task of tasks) {
    const checkbox = task.querySelector('input[type="checkbox"]');
    checkbox.checked = false;
    task.classList.remove('completed');
    task.querySelector('span').style.display = 'none';
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
