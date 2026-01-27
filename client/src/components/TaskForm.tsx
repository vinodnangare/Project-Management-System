import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { createTask } from '../store/thunks';
import '../styles/TaskForm.css';
import apiClient from '../api/client';

/**
 * TaskForm Component
 * Handles creation and editing of tasks
 */

interface TaskFormProps {
  onTaskCreated?: (taskId: string) => void;
  onClose?: () => void;
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskCreated, onClose }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);

  const [employees, setEmployees] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [employeesError, setEmployeesError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignees: [] as string[],
    due_date: '',
    estimated_hours: '',
    created_by: user?.id || ''
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      if (user?.role !== 'admin') return;
      try {
        const response = await apiClient.getAssignableUsers();
        setEmployees(response.data.data || []);
      } catch (err) {
        setEmployeesError('Failed to load employees');
      }
    };

    fetchEmployees();
  }, [user?.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssigneeChange = (employeeId: string) => {
    setFormData((prev) => {
      const isSelected = prev.assignees.includes(employeeId);
      return {
        ...prev,
        assignees: isSelected
          ? prev.assignees.filter((id) => id !== employeeId)
          : [...prev.assignees, employeeId]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }

    try {
      const result = await dispatch(createTask({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        assigned_to: formData.assignees[0] || undefined,
        assignees: formData.assignees,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
        created_by: user?.id || ''
      }));

      // Check if the thunk was fulfilled
      if (createTask.fulfilled.match(result)) {
        onTaskCreated?.(result.payload.id);
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          assignees: [],
          due_date: '',
          estimated_hours: '',
          created_by: user?.id || ''
        });
      }
    } catch (err) {
      setFormError('Failed to create task');
    }
  };

  return (
    <div className="task-form-container">
      <div className="form-header">
        <h2>Create New Task</h2>
        <p>Assign work and set priorities to keep your team aligned.</p>
      </div>

      {formError && <div className="alert alert-error">{formError}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="task-form">
        <label className="field">
          <span>📋 Title *</span>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What needs to be done?"
            required
          />
        </label>

        <label className="field">
          <span>📝 Description</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide context and details for the task..."
            rows={4}
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span>🎯 Priority</span>
            <select name="priority" value={formData.priority} onChange={handleChange}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>👥 Assign to (multi-select)</span>
            {employeesError && <div className="alert alert-error">{employeesError}</div>}
            <div className="multi-select-container">
              {employees.length === 0 ? (
                <div className="multi-select-empty">No employees available</div>
              ) : (
                employees.map((emp) => (
                  <label key={emp.id} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={formData.assignees.includes(emp.id)}
                      onChange={() => handleAssigneeChange(emp.id)}
                    />
                    <span>{emp.full_name} ({emp.email})</span>
                  </label>
                ))
              )}
            </div>
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>📅 Due Date</span>
            <input
              type="datetime-local"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
            />
          </label>

          <label className="field">
            <span>⏱️ Est. Hours</span>
            <input
              type="number"
              name="estimated_hours"
              value={formData.estimated_hours}
              onChange={handleChange}
              placeholder="e.g., 8"
              min="0"
              step="0.5"
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? 'Creating…' : '✚ Create Task'}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
