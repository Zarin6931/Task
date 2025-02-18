let currentTaskId = null;
window.editTask = function(taskId) {
    if (!taskId) return;
    const modal = document.getElementById('editTaskModal');
    fetch(`/get_task/${taskId}`)
        .then(response => response.json())
        .then(task => {
            const form = document.getElementById('editTaskForm');
            form.querySelector('input[name="title"]').value = task.title;
            form.querySelector('input[name="due_date"]').value = task.due_date;
            window.calendarEditor.setContents(task.description || '');
            form.querySelector('input[name="important"]').checked = task.important;
            form.querySelector('input[name="urgent"]').checked = task.urgent;
            modal.style.display = 'block';
        });
}

async function toggleTaskComplete(taskId) {
    if (!taskId) return;
    try {
        const response = await fetch(`/complete_task/${taskId}`, { 
            method: 'POST' 
        });
        const data = await response.json();
        if (data.success) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function getEventClassName(task) {
    if (!task) return 'normal';
    if (task.completed) return 'completed';
    if (task.urgent) return 'urgent';
    if (task.important) return 'important';
    return 'normal';
}

function showAddTaskModal(date) {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.querySelector('input[name="due_date"]').value = date;
        modal.style.display = 'block';
    }
}

function editTask(taskId) {
    if (!taskId) return;
    const modal = document.getElementById('editTaskModal');
    fetch(`/get_task/${taskId}`)
        .then(response => response.json())
        .then(task => {
            const form = document.getElementById('editTaskForm');
            form.querySelector('input[name="title"]').value = task.title;
            form.querySelector('input[name="due_date"]').value = task.due_date;
            form.querySelector('textarea[name="description"]').value = task.description || '';
            form.querySelector('input[name="important"]').checked = task.important;
            form.querySelector('input[name="urgent"]').checked = task.urgent;
            modal.style.display = 'block';
        });
}

function showViewTaskModal(event) {
    const modal = document.getElementById('viewTaskModal');
    if (!modal || !event) return;

    modal.querySelector('#taskTitle').textContent = event.title || '';
    modal.querySelector('#taskDescription').innerHTML = event.extendedProps?.description || 'Нет описания';
    modal.querySelector('#taskDate').textContent = event.start ? event.start.toLocaleDateString('ru-RU') : 'Дата не указана';
    modal.querySelector('#taskStatus').textContent = event.extendedProps?.completed ? 'Завершено' : 'В процессе';
    modal.style.display = 'block';
}


document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    function getEventClassName(props) {
        if (!props) return 'normal';
        if (props.completed) return 'completed';
        if (props.urgent) return 'urgent';
        if (props.important) return 'important';
        return 'normal';
    }

    window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ru',
        buttonText: {
            today: 'Сегодня'
        },
        events: (typeof calendarEvents !== 'undefined' ? calendarEvents : []).map(event => {
            if (!event || !event.title) return null;
            return {
                id: event.id,
                title: event.title,
                start: event.start,
                className: event.completed ? 'completed' : 
                         event.urgent ? 'urgent' : 
                         event.important ? 'important' : 'normal',
                extendedProps: {
                    description: event.description || '',
                    completed: event.completed || false,
                    urgent: event.urgent || false,
                    important: event.important || false
                }
            };
            return {
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                className: getEventClassName(props),
                extendedProps: props
            };
        }).filter(Boolean),
        dateClick: function(info) {
            showAddTaskModal(info.dateStr);
        },
        eventClick: function(info) {
            currentTaskId = info.event.id;
            showViewTaskModal(info.event);
        }
    });

    calendar.render();

    // Инициализация SunEditor для обоих текстовых полей
    window.addEditor = SUNEDITOR.create('addDescription', {
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

    window.calendarEditor = SUNEDITOR.create('editDescription', {
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

    // Обработчики модальных окон
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.closest('.modal').style.display = 'none';
        };
    });

    // Обработка формы добавления задачи
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.set('description', window.addEditor.getContents());
            formData.set('important', this.querySelector('input[name="important"]').checked);
            formData.set('urgent', this.querySelector('input[name="urgent"]').checked);

            try {
                const response = await fetch('/add_task', {
                    method: 'POST',
                    body: formData
                });
                if (response.redirected) {
                    window.location.href = response.url;
                } else if (response.ok) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
    }

    // Обработка формы редактирования задачи
    const editTaskForm = document.getElementById('editTaskForm');
    if (editTaskForm) {
        editTaskForm.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('task_id', currentTaskId);
            formData.set('description', window.calendarEditor.getContents());
            formData.set('important', this.querySelector('input[name="important"]').checked);
            formData.set('urgent', this.querySelector('input[name="urgent"]').checked);

            try {
                const response = await fetch('/edit_task', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
    }
});