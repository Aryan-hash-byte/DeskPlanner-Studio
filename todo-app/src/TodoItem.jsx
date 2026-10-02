import React from 'react';

export default function TodoItem({ task, onToggle, onDelete, formatDate }) {
  return (
    <li className={`task-row highlight-${task.priority} ${task.completed ? 'completed' : ''}`}>
      <div className="checkbox-wrapper" onClick={onToggle}>
        <div className={`custom-checkbox ${task.completed ? 'checked' : ''}`}>
          {task.completed && '✓'}
        </div>
      </div>
      <div className="task-content-block">
        <span className="task-main-text">{task.text}</span>
        <span className="task-meta-details">📅 {formatDate(task.date)} &nbsp;|&nbsp; ⏰ {task.time}</span>
      </div>
      <button className="delete-task-cross" onClick={onDelete}>✕</button>
    </li>
  );
}

