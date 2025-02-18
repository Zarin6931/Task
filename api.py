from flask import jsonify, request, Blueprint, send_file
from models import db, Task, JournalEntry, Contact
from datetime import datetime
from io import BytesIO
import xlsxwriter

api = Blueprint('api', __name__)

@api.route('/api/tasks/export/<date>', methods=['GET'])
def export_tasks(date):
    tasks = Task.query.filter(
        db.func.date(Task.due_date) == date
    ).all()
    
    output = BytesIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet()
    
    # Заголовки
    headers = ['Название', 'Описание', 'Дата', 'Статус', 'Важное', 'Срочное']
    for col, header in enumerate(headers):
        worksheet.write(0, col, header)
    
    # Данные
    for row, task in enumerate(tasks, 1):
        worksheet.write(row, 0, task.title)
        worksheet.write(row, 1, task.description or '')
        worksheet.write(row, 2, task.due_date.strftime('%d.%m.%Y'))
        worksheet.write(row, 3, 'Выполнено' if task.completed else 'Не выполнено')
        worksheet.write(row, 4, 'Да' if task.important else 'Нет')
        worksheet.write(row, 5, 'Да' if task.urgent else 'Нет')
    
    workbook.close()
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'tasks_{date}.xlsx'
    )

@api.route('/api/contacts', methods=['GET'])
def get_contacts():
    contacts = Contact.query.all()
    return jsonify([contact.to_dict() for contact in contacts])

@api.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'created_date': task.created_date.isoformat(),
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'completed': task.completed,
        'important': task.important,
        'urgent': task.urgent
    } for task in tasks])

@api.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        important=data.get('important', False),
        urgent=data.get('urgent', False)
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({
        'id': task.id,
        'message': 'Task created successfully'
    }), 201

@api.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()

    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.due_date = datetime.fromisoformat(data['due_date']) if data.get('due_date') else task.due_date
    task.completed = data.get('completed', task.completed)
    task.important = data.get('important', task.important)
    task.urgent = data.get('urgent', task.urgent)

    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})

@api.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'})

@api.route('/api/tasks/stats', methods=['GET'])
def get_task_stats():
    tasks = Task.query.all()
    return jsonify({
        'total': len(tasks),
        'completed': len([t for t in tasks if t.completed]),
        'important': len([t for t in tasks if t.important]),
        'urgent': len([t for t in tasks if t.urgent])
    })

@api.errorhandler(400)
def bad_request_error(error):
    return jsonify({'error': 'Bad request', 'message': str(error)}), 400

@api.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found', 'message': 'Resource not found'}), 404

@api.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500