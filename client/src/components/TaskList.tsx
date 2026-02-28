import React, { useState, RefObject } from 'react';
import { useGetTasksQuery } from '../services/api';
import { HiOutlineSearch, HiOutlineX, HiOutlineClipboardList, HiOutlineCalendar, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import '../styles/TaskList.css';
import type { TaskListProps, Filters } from '../types/components/TaskListProps';

const getPriorityClass = (priority: string): string => {
  switch (priority) {
    case 'HIGH':
      return 'priority-high';
    case 'MEDIUM':
      return 'priority-medium';
    case 'LOW':
      return 'priority-low';
    default:
      return 'priority-default';
  }
};

const getStatusClass = (status: string): string => {
  return `status-${status.toLowerCase().replace('_', '-')}`;
};

interface TaskListWithRefProps extends TaskListProps {
  searchInputRef?: RefObject<HTMLInputElement>;
}

export const TaskList: React.FC<TaskListWithRefProps> = ({ onTaskSelect, selectedTaskId, searchInputRef }) => {
  const { data: tasksData, isLoading: loading, error } = useGetTasksQuery({ page: 1, limit: 50 });
  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.meta;
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    priority: ''
  });

  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: ''
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority;

  if (loading && tasks.length === 0) {
    return (
      <div className="task-list-container">
        <div className="loading">Loading tasks...</div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="task-list-container">
        <div className="error">{(error as any)?.data?.message || 'Failed to load tasks'}</div>
      </div>
    );
  }

  return (
    <div className="tasks-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>All Tasks</h2>
          <p className="header-sub">{pagination?.total ?? tasks.length} total</p>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <div className="search-wrapper">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input search-input"
              ref={searchInputRef}
            />
          </div>
        </div>

        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            <HiOutlineX className="btn-icon" />
            Clear
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-block">
          <HiOutlineClipboardList className="empty-icon" />
          <p>No tasks found. Create one to get started!</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-block">
          <HiOutlineSearch className="empty-icon" />
          <p>No tasks match your filters.</p>
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map((task: any) => {
            const daysLeft = task.due_date
              ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <article
                key={task.id}
                className={`task-item ${selectedTaskId === task.id ? 'active' : ''}`}
                onClick={() => onTaskSelect(task.id)}
              >
                <div className="task-main">
                  <div>
                    <p className="task-title">{task.title}</p>
                    {task.assigned_to && (
                      <p className="task-assigned">
                        Assigned to {task.assigned_to_user?.full_name || task.assigned_to_user?.email || task.assigned_to_name || task.assigned_to_email || task.assigned_to}
                      </p>
                    )}
                  </div>
                  <div className="task-badges">
                    <span className={`badge ${getStatusClass(task.status)}`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`badge ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                {task.due_date && (
                  <p className="task-due">
                    <HiOutlineCalendar className="due-icon" />
                    {daysLeft !== null
                      ? daysLeft > 0
                        ? `${daysLeft}d left`
                        : daysLeft === 0
                        ? 'Today'
                        : 'Overdue'
                      : 'No date'}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={true}
            className="pag-btn"
          >
            <HiOutlineChevronLeft className="pag-icon" />
            Previous
          </button>
          <span className="pag-info">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            disabled={true}
            className="pag-btn"
          >
            Next
            <HiOutlineChevronRight className="pag-icon" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
