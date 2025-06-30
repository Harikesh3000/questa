const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date');
const prioritySelect = document.getElementById('priority');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-task');
const sortSelect = document.getElementById('sort');
const clearBtn = document.getElementById('clear-all');
const stats = document.getElementById('task-stats');
const themeToggle = document.getElementById('toggle-theme');

// Theme toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}

// Notification permission
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = prioritySelect.value;
  if (!text) return;

  addTask(text, dueDate, priority);
  notify(`Task Added: ${text}`);
  taskInput.value = '';
  dueDateInput.value = '';
  prioritySelect.value = 'Low';
});

searchInput.addEventListener('input', filterTasks);
sortSelect.addEventListener('change', sortTasks);

clearBtn.addEventListener('click', () => {
  if (confirm('Clear all tasks?')) {
    localStorage.removeItem('tasks');
    taskList.innerHTML = '';
    updateStats();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  updateStats();
  updateStreak();
});

function notify(msg) {
  if (Notification.permission === 'granted') {
    new Notification(msg);
  }
}

function addTask(text, dueDate, priority, completed = false) {
  const li = document.createElement('li');
  if (completed) li.classList.add('completed');

  li.innerHTML = `
    <div class="task-title">${priorityIcon(priority)} ${text}</div>
    <div class="task-meta">${dueDate ? `Due: ${dueDate}` : ''} | Priority: ${priority}</div>
    <div class="task-actions">
      <button class="complete-btn">✓</button>
      <button class="edit-btn">✏️</button>
      <button class="delete-btn">X</button>
    </div>
  `;

  taskList.appendChild(li);
  setupTaskActions(li);
  saveTasks();
  updateStats();
}

function setupTaskActions(li) {
  li.querySelector('.complete-btn').addEventListener('click', () => {
    li.classList.toggle('completed');
    saveTasks();
    updateStats();
    updateStreak();
  });

  li.querySelector('.delete-btn').addEventListener('click', () => {
    li.remove();
    saveTasks();
    updateStats();
  });

  li.querySelector('.edit-btn').addEventListener('click', () => {
    const newText = prompt('Edit task:', li.querySelector('.task-title').textContent.slice(2));
    if (newText) {
      li.querySelector('.task-title').innerHTML = `${priorityIcon(getPriority(li))} ${newText}`;
      saveTasks();
    }
  });
}

function getPriority(li) {
  return li.querySelector('.task-meta').textContent.match(/Priority: (\w+)/)?.[1] || 'Low';
}

function priorityIcon(priority) {
  return {
    Low: '🔵',
    Medium: '🟡',
    High: '🔴'
  }[priority];
}

function saveTasks() {
  const tasks = [];
  taskList.querySelectorAll('li').forEach(li => {
    const title = li.querySelector('.task-title').textContent.slice(2);
    const meta = li.querySelector('.task-meta').textContent;
    tasks.push({
      text: title,
      dueDate: meta.match(/Due: (\d{4}-\d{2}-\d{2})/)?.[1] || '',
      priority: meta.match(/Priority: (\w+)/)?.[1] || 'Low',
      completed: li.classList.contains('completed')
    });
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('tasks')) || [];
  saved.forEach(task => addTask(task.text, task.dueDate, task.priority, task.completed));
  sortTasks();
}

function filterTasks() {
  const query = searchInput.value.toLowerCase();
  taskList.querySelectorAll('li').forEach(li => {
    const title = li.querySelector('.task-title').textContent.toLowerCase();
    li.style.display = title.includes(query) ? 'block' : 'none';
  });
}

function sortTasks() {
  const sortBy = sortSelect.value;
  const tasks = Array.from(taskList.children);
  tasks.sort((a, b) => {
    const aText = a.querySelector('.task-title').textContent.slice(2);
    const bText = b.querySelector('.task-title').textContent.slice(2);
    const aDate = a.querySelector('.task-meta').textContent.match(/Due: (\d{4}-\d{2}-\d{2})/)?.[1];
    const bDate = b.querySelector('.task-meta').textContent.match(/Due: (\d{4}-\d{2}-\d{2})/)?.[1];
    const aPriority = getPriority(a);
    const bPriority = getPriority(b);

    if (sortBy === 'date') {
      return (aDate || '').localeCompare(bDate || '');
    } else if (sortBy === 'priority') {
      const order = { High: 1, Medium: 2, Low: 3 };
      return order[aPriority] - order[bPriority];
    }
    return aText.localeCompare(bText);
  });

  tasks.forEach(task => taskList.appendChild(task));
}

function updateStats() {
  const tasks = Array.from(taskList.querySelectorAll('li'));
  const total = tasks.length;
  const completed = tasks.filter(t => t.classList.contains('completed')).length;
  stats.textContent = `Total: ${total} | Completed: ${completed} | Pending: ${total - completed}`;
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastActive = localStorage.getItem('lastActiveDate');
  let streak = parseInt(localStorage.getItem('streak') || '0');

  if (lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (new Date(lastActive).toDateString() === yesterday.toDateString()) {
      streak++;
    } else {
      streak = 1; // reset
    }

    localStorage.setItem('lastActiveDate', today);
    localStorage.setItem('streak', streak);
  }

  document.getElementById('streak-tracker').textContent = `🔥 Streak: ${streak} day${streak > 1 ? 's' : ''}`;
}
