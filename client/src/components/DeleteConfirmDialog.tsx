import React from 'react';

interface DeleteConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  title,
  message,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <p className="warning-text">This action cannot be undone.</p>
        <div className="confirmation-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
};
