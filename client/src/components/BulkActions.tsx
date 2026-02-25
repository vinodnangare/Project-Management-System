import React, { useState } from 'react';
import { 
  HiOutlineUser, 
  HiOutlineFlag, 
  HiOutlineFire, 
  HiOutlineTrash, 
  HiOutlineX 
} from 'react-icons/hi';
import '../styles/components/BulkActions.css';
import type { BulkActionsProps } from '../types/components/BulkActionsProps';

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onAssign,
  onChangeStage,
  onChangePriority,
  onDelete,
  onClearSelection,
}) => {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const handleStageChange = (stage: string) => {
    onChangeStage?.(stage);
    setShowStageMenu(false);
  };

  const handlePriorityChange = (priority: string) => {
    onChangePriority?.(priority);
    setShowPriorityMenu(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bulk-actions-container">
      <div className="bulk-actions-bar">
        <div className="selection-info">
          <span className="selection-count">{selectedCount}</span>
          <span className="selection-text">lead{selectedCount !== 1 ? 's' : ''} selected</span>
        </div>

        <div className="actions-group">
          {onAssign && (
            <button
              className="action-btn"
              onClick={onAssign}
              title="Assign to owner"
            >
              <HiOutlineUser className="btn-icon" /> Assign
            </button>
          )}

          {onChangeStage && (
            <div className="action-dropdown">
              <button
                className="action-btn"
                onClick={() => setShowStageMenu(!showStageMenu)}
              >
                <HiOutlineFlag className="btn-icon" /> Change Stage
              </button>
              {showStageMenu && (
                <div className="dropdown-menu">
                  <button onClick={() => handleStageChange('new')}>New</button>
                  <button onClick={() => handleStageChange('in_discussion')}>In Discussion</button>
                  <button onClick={() => handleStageChange('quoted')}>Quoted</button>
                  <button onClick={() => handleStageChange('won')}>Won</button>
                  <button onClick={() => handleStageChange('lost')}>Lost</button>
                </div>
              )}
            </div>
          )}

          {onChangePriority && (
            <div className="action-dropdown">
              <button
                className="action-btn"
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              >
                <HiOutlineFire className="btn-icon" /> Change Priority
              </button>
              {showPriorityMenu && (
                <div className="dropdown-menu">
                  <button onClick={() => handlePriorityChange('high')}>High</button>
                  <button onClick={() => handlePriorityChange('medium')}>Medium</button>
                  <button onClick={() => handlePriorityChange('low')}>Low</button>
                </div>
              )}
            </div>
          )}

          {onDelete && (
            <button
              className="action-btn action-btn-danger"
              onClick={onDelete}
              title="Delete selected leads"
            >
              <HiOutlineTrash className="btn-icon" /> Delete
            </button>
          )}

          <button
            className="action-btn-secondary"
            onClick={onClearSelection}
          >
            <HiOutlineX className="btn-icon" /> Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;