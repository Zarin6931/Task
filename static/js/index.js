// Часы
function updateClock() {
    const clockEl = document.getElementById('clock');
    const weekdayEl = document.getElementById('weekday');
    const dateEl = document.getElementById('date');

    if (!clockEl || !weekdayEl || !dateEl) {
        return; // Если элементы не найдены, прекращаем выполнение
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU');
    const weekDay = now.toLocaleDateString('ru-RU', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('ru-RU', { 
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    clockEl.textContent = timeStr;
    weekdayEl.textContent = weekDay;
    dateEl.textContent = dateStr;
}

// Обновление статистики
async function updateStats() {
    try {
        const response = await fetch('/api/tasks/stats');
        const stats = await response.json();

        const total = stats.total || 1; // Избегаем деления на ноль
        const updateProgress = (selector, value) => {
            const elem = document.querySelector(selector);
            if (elem) {
                const percentage = total > 0 ? (value * 100 / total) : 0;
                elem.style.setProperty('--progress', percentage + '%');
                elem.querySelector('.value-container').textContent = value;
            }
        };

        updateProgress('.circular-progress.urgent', stats.urgent);
        updateProgress('.circular-progress.important', stats.important);
        updateProgress('.circular-progress.completed', stats.completed);
        const regularTasks = Math.max(0, stats.total - stats.urgent - stats.important - stats.completed);
        updateProgress('.circular-progress:not(.urgent):not(.important):not(.completed)', regularTasks);
    } catch (error) {
        console.error('Ошибка при обновлении статистики:', error);
    }
}

// Запускаем обновление статистики каждые 30 секунд
setInterval(updateStats, 30000);



// Анимация прогресс-баров в дедлайнах
function animateDeadlineProgress() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 100);
    });
}

document.addEventListener('DOMContentLoaded', function() {

    // Инициализация остальных функций
    setInterval(updateClock, 1000);
    updateClock();
    updateStats();
    updateTaskWidgets();
    setInterval(updateTaskWidgets, 30000);
});

async function updateTaskWidgets() {
    const response = await fetch('/api/tasks');
    const tasks = await response.json();

    const urgentTasks = tasks.filter(task => task.urgent && !task.completed);
    const importantTasks = tasks.filter(task => task.important && !task.completed);

    updateTaskList('urgentTasksList', urgentTasks);
    updateTaskList('importantTasksList', importantTasks);
}

function updateTaskList(containerId, tasks) {
    const container = document.getElementById(containerId);
    container.innerHTML = tasks.length ? '' : '<p>Нет активных задач</p>';

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-header">
                <span>${task.title}</span>
                <button class="complete-btn" onclick="completeTask(${task.id}, '${containerId}')">
                    Выполнено
                </button>
            </div>
            <div class="task-description">${task.description || 'Нет описания'}</div>
        `;

        taskElement.querySelector('.task-header').addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                const desc = taskElement.querySelector('.task-description');
                desc.classList.toggle('show');
            }
        });

        container.appendChild(taskElement);
    });
}

async function completeTask(taskId, containerId) {
    const response = await fetch(`/complete_task/${taskId}`, {
        method: 'POST'
    });

    if (response.ok) {
        updateTaskWidgets();
    }
}