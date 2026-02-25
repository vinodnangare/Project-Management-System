import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useGetAssignableUsersQuery, useCreateTaskMutation } from '../services/api';
import { 
  HiOutlineClipboardList, 
  HiOutlineDocumentText, 
  HiOutlineFlag, 
  HiOutlineUserGroup, 
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlinePlus
} from 'react-icons/hi';
import '../styles/TaskForm.css';
import type { TaskFormProps } from '../types/components/TaskFormProps';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskCreated, onClose }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { data: employees = [], error: employeesError } = useGetAssignableUsersQuery();
  const [createTask, { isLoading: loading, error }] = useCreateTaskMutation();

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
      const message = 'Title is required';
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      const result = await createTask({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        assigned_to: formData.assignees[0] || undefined,
        assignees: formData.assignees,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
        created_by: user?.id || ''
      }).unwrap();
      
      toast.success('Task created successfully');
      onTaskCreated?.(result.id);
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assignees: [],
        due_date: '',
        estimated_hours: '',
        created_by: user?.id || ''
      });
    } catch (err) {
      const message = 'Failed to create task';
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <div className="task-form-container">
      <div className="form-header">
        <h2>Create New Task</h2>
        <p>Assign work and set priorities to keep your team aligned.</p>
      </div>

      {formError && <div className="alert alert-error">{formError}</div>}
      {error && <div className="alert alert-error">{(error as any)?.data?.message || 'Failed to create task'}</div>}

      <form onSubmit={handleSubmit} className="task-form">
        <label className="field">
          <span><HiOutlineClipboardList className="field-icon" /> Title *</span>
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
          <span><HiOutlineDocumentText className="field-icon" /> Description</span>
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
            <span><HiOutlineFlag className="field-icon" /> Priority</span>
            <select name="priority" value={formData.priority} onChange={handleChange}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span><HiOutlineUserGroup className="field-icon" /> Assign to (multi-select)</span>
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
            <span><HiOutlineCalendar className="field-icon" /> Due Date</span>
            <input
              type="datetime-local"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
            />
          </label>

          <label className="field">
            <span><HiOutlineClock className="field-icon" /> Est. Hours</span>
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
            {loading ? 'Creating...' : <><HiOutlinePlus className="btn-icon" /> Create Task</>}
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
