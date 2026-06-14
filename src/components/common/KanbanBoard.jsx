/**
 * Kanban Board Component
 * Drag & drop board for operations management
 */

import { useState } from 'react';
import './KanbanBoard.css';

// Default columns for operations
const DEFAULT_COLUMNS = [
    { id: 'pending', title: 'Pending', icon: 'schedule', color: '#6c757d' },
    { id: 'scheduled', title: 'Scheduled', icon: 'event', color: '#0d6efd' },
    { id: 'in_progress', title: 'In Progress', icon: 'play_circle', color: '#d35400' },
    { id: 'quality_check', title: 'Quality Check', icon: 'verified', color: '#6f42c1' },
    { id: 'completed', title: 'Completed', icon: 'check_circle', color: '#198754' },
];

const KanbanCard = ({ item, onDragStart, onDragEnd, onClick }) => {
    return (
        <div
            className="kanban-card"
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onDragEnd={onDragEnd}
            onClick={() => onClick?.(item)}
        >
            <div className="kanban-card-header">
                <span className="kanban-card-folio">{item.folio || `OP-${item.id?.slice(0, 6)}`}</span>
                {item.priority && (
                    <span className={`kanban-card-priority ${item.priority}`}>
                        {item.priority}
                    </span>
                )}
            </div>
            <div className="kanban-card-title">{item.productName || item.name || 'Operation'}</div>
            {item.projectName && (
                <div className="kanban-card-project">
                    <span className="material-symbols-rounded">folder</span>
                    {item.projectName}
                </div>
            )}
            <div className="kanban-card-footer">
                <div className="kanban-card-quantity">
                    <span className="material-symbols-rounded">inventory_2</span>
                    {item.quantity || 1} units
                </div>
                {item.progress !== undefined && (
                    <div className="kanban-card-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                        </div>
                        <span>{item.progress}%</span>
                    </div>
                )}
            </div>
            {item.dueDate && (
                <div className="kanban-card-due">
                    <span className="material-symbols-rounded">event</span>
                    {new Date(item.dueDate).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

const KanbanColumn = ({
    column,
    items,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onCardClick
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver?.(e, column.id);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop?.(e, column.id);
    };

    return (
        <div
            className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="kanban-column-header" style={{ '--column-color': column.color }}>
                <div className="column-title">
                    <span className="material-symbols-rounded">{column.icon}</span>
                    <span>{column.title}</span>
                </div>
                <span className="column-count">{items.length}</span>
            </div>
            <div className="kanban-column-body">
                {items.map(item => (
                    <KanbanCard
                        key={item.id}
                        item={item}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onClick={onCardClick}
                    />
                ))}
                {items.length === 0 && (
                    <div className="kanban-empty">
                        <span className="material-symbols-rounded">inbox</span>
                        <span>No items</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const KanbanBoard = ({
    items = [],
    columns = DEFAULT_COLUMNS,
    statusField = 'status',
    onStatusChange,
    onCardClick
}) => {
    const [draggedItem, setDraggedItem] = useState(null);

    // Group items by status
    const groupedItems = columns.reduce((acc, column) => {
        acc[column.id] = items.filter(item => {
            const status = (item[statusField] || 'pending').toLowerCase().replace(/\s+/g, '_');
            return status === column.id;
        });
        return acc;
    }, {});

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);

        // Add dragging class after a short delay
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDraggedItem(null);
    };

    const handleDrop = (e, columnId) => {
        e.preventDefault();

        if (draggedItem && onStatusChange) {
            const currentStatus = (draggedItem[statusField] || '').toLowerCase().replace(/\s+/g, '_');
            if (currentStatus !== columnId) {
                onStatusChange(draggedItem, columnId);
            }
        }

        setDraggedItem(null);
    };

    return (
        <div className="kanban-board">
            {columns.map(column => (
                <KanbanColumn
                    key={column.id}
                    column={column}
                    items={groupedItems[column.id] || []}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onCardClick={onCardClick}
                />
            ))}
        </div>
    );
};

export default KanbanBoard;
