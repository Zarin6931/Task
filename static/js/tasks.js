document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const date = new URLSearchParams(window.location.search).get('date') || today;
    document.getElementById('taskDate').value = date;
    filterTasksByDate(date);

    // Инициализация редактора
    window.taskEditor = SUNEDITOR.create(document.getElementById('editDescription'), {
        lang: SUNEDITOR_LANG['ru'],
        buttonList: [
            ['undo', 'redo'],
            ['font', 'fontSize', 'formatBlock'],
            ['bold', 'underline', 'italic', 'strike'],
            ['removeFormat'],
            ['fontColor', 'hiliteColor'],
            ['indent', 'outdent'],
            ['align', 'horizontalRule', 'list', 'table'],
            ['link', 'image'],
            ['fullScreen', 'showBlocks', 'codeView']
        ],
        width: '100%',
        height: '200px'
    });
});

async function handleTaskAction(action, taskId) {
    const response = await fetch(`/${action}/${taskId}`, {
        method: 'POST'
    });
    const data = await response.json();
    if (data.success) {
        if (action === 'delete_task') {
            document.querySelector(`[data-task-id="${taskId}"]`).remove();
        } else {
            location.reload();
        }
    }
}

async function toggleComplete(taskId) {
    const response = await fetch(`/complete_task/${taskId}`, {
        method: 'POST'
    });
    const data = await response.json();
    if (data.success) {
        const task = document.querySelector(`[data-task-id="${taskId}"]`);
        task.classList.toggle('completed');
        const button = task.querySelector('.btn-success');
        button.innerHTML = `<i class="fas fa-check"></i> ${data.completed ? 'Отменить' : 'Завершить'}`;
        updateTaskFilters();
    }
}

async function toggleImportant(taskId) {
    const response = await fetch(`/toggle_important/${taskId}`, {
        method: 'POST'
    });
    const data = await response.json();
    if (data.success) {
        const task = document.querySelector(`[data-task-id="${taskId}"]`);
        const button = task.querySelector('.btn-warning');
        button.classList.toggle('active');
        updateTaskFilters();
    }
}

async function toggleUrgent(taskId) {
    const response = await fetch(`/toggle_urgent/${taskId}`, {
        method: 'POST'
    });
    const data = await response.json();
    if (data.success) {
        const task = document.querySelector(`[data-task-id="${taskId}"]`);
        const button = task.querySelector('.btn-danger');
        button.classList.toggle('active');
        updateTaskFilters();
    }
}

function sortTasks(criteria) {
    const selectedDate = document.getElementById('taskDate').value;
    const tasks = document.querySelectorAll('.task');
    
    tasks.forEach(task => {
        const taskDate = task.dataset.date;
        if (taskDate === selectedDate) {
            const isCompleted = task.classList.contains('completed');
            const isImportant = task.querySelector('.btn-warning.active');
            const isUrgent = task.querySelector('.btn-danger.active');

            let showTask = criteria === 'all' || 
                          (criteria === 'completed' && isCompleted) ||
                          (criteria === 'important' && isImportant) ||
                          (criteria === 'urgent' && isUrgent) ||
                          (criteria === 'normal' && !isCompleted && !isImportant && !isUrgent);

            task.style.display = showTask ? 'block' : 'none';
        } else {
            task.style.display = 'none';
        }
    });
}

function updateTaskFilters() {
    const currentFilter = document.getElementById('sortTasks').value;
    filterTasks(currentFilter);
}

async function deleteTask(taskId) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        const response = await fetch(`/delete_task/${taskId}`, {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            document.querySelector(`[data-task-id="${taskId}"]`).remove();
            updateTaskFilters();
        }
    }
}

function filterTasks(criteria) {
    const tasks = document.querySelectorAll('.task');
    const selectedDate = document.getElementById('taskDate').value;

    tasks.forEach(task => {
        const taskDate = task.dataset.date;
        if (taskDate === selectedDate) {
            const isCompleted = task.classList.contains('completed');
            const isImportant = task.querySelector('.btn-warning.active');
            const isUrgent = task.querySelector('.btn-danger.active');

            let showTask = criteria === 'all' || 
                          (criteria === 'completed' && isCompleted) ||
                          (criteria === 'important' && isImportant) ||
                          (criteria === 'urgent' && isUrgent) ||
                          (criteria === 'normal' && !isCompleted && !isImportant && !isUrgent);

            task.style.display = showTask ? 'block' : 'none';
        } else {
            task.style.display = 'none';
        }
    });
}

function filterTasksByDate(date) {
    const tasks = document.querySelectorAll('.task');
    tasks.forEach(task => {
        task.style.display = (task.dataset.date === date) ? 'block' : 'none';
    });
    const currentFilter = document.getElementById('sortTasks').value;
    filterTasks(currentFilter);
}

function handleEditTask(taskId) {
    const modal = document.getElementById('editModal');
    fetch(`/get_task/${taskId}`)
        .then(response => response.json())
        .then(task => {
            document.getElementById('editTaskId').value = taskId;
            document.getElementById('editTitle').value = task.title;
            document.getElementById('editDueDate').value = task.due_date;
            if (window.taskEditor) {
                window.taskEditor.setContents(task.description);
            }
            modal.style.display = 'block';
        });
}

// Обработка модального окна
const modal = document.getElementById('editModal');
const span = document.getElementsByClassName('close')[0];

span.onclick = function() {
    modal.style.display = 'none';
}

async function exportTasks() {
    const selectedDate = document.getElementById('taskDate').value;
    window.location.href = `/api/tasks/export/${selectedDate}`;
}

function printTasks() {
    const tasksDiv = document.getElementById('tasksList');
    const currentFilter = document.getElementById('sortTasks').value;
    const date = document.getElementById('taskDate').value;
    
    // Создаем временный div для печати
    const printDiv = document.createElement('div');
    printDiv.innerHTML = `<h2>Задачи на ${new Date(date).toLocaleDateString('ru-RU')}</h2>`;
    
    // Копируем только видимые задачи
    const visibleTasks = Array.from(tasksDiv.getElementsByClassName('task'))
        .filter(task => task.style.display !== 'none');
    
    visibleTasks.forEach(task => {
        const clone = task.cloneNode(true);
        // Удаляем кнопки действий для печати
        const actions = clone.querySelector('.task-actions');
        if (actions) actions.remove();
        printDiv.appendChild(clone);
    });
    
    // Сохраняем текущее содержимое body
    const originalContents = document.body.innerHTML;
    
    // Заменяем содержимое для печати
    document.body.innerHTML = printDiv.innerHTML;
    
    // Печатаем
    window.print();
    
    // Восстанавливаем оригинальное содержимое
    document.body.innerHTML = originalContents;
    
    // Переинициализируем обработчики событий
    document.dispatchEvent(new Event('DOMContentLoaded'));
}

document.getElementById('editTaskForm').onsubmit = async function(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('task_id', document.getElementById('editTaskId').value);
    formData.append('title', document.getElementById('editTitle').value);
    formData.append('description', window.taskEditor.getContents());
    formData.append('due_date', document.getElementById('editDueDate').value);

    const response = await fetch('/edit_task', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        const data = await response.json();
        if (data.success) {
            const task = document.querySelector(`[data-task-id="${data.task.id}"]`);
            task.dataset.date = data.task.due_date;
            task.querySelector('.h4').textContent = data.task.title;
            task.querySelector('.task-description').innerHTML = data.task.description || '';
            task.querySelector('.task-date').innerHTML = `<i class="fas fa-calendar-alt"></i> ${new Date(data.task.due_date).toLocaleDateString('ru-RU')}`;
            modal.style.display = 'none';
            filterTasksByDate(document.getElementById('taskDate').value);
        }
    }
}