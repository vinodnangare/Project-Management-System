import React from 'react';
import '../styles/components/StageSelector.css';
import type { StageSelectorProps } from '../types/components/StageSelectorProps';

const stages = [
  { value: 'new', label: 'New', color: '#3b82f6', icon: '\ud83c\udd95' },
  { value: 'qualified', label: 'Qualified', color: '#8b5cf6', icon: '\u2705' },
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b', icon: '\ud83d\udd04' },
  { value: 'won', label: 'Won', color: '#10b981', icon: '\ud83c\udf89' },
  { value: 'lost', label: 'Lost', color: '#ef4444', icon: '\u274c' },
];

const StageSelector: React.FC<StageSelectorProps> = ({
  currentStage,
  onChange,
  disabled = false,
  size = 'medium',
}) => {
  const currentStageData = stages.find(s => s.value === currentStage);

  return (
    <div className={`stage-selector stage-selector-${size}`}>
      <select
        value={currentStage}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="stage-select"
        style={{
          borderColor: currentStageData?.color,
          color: currentStageData?.color,
        }}
      >
        {stages.map((stage) => (
          <option key={stage.value} value={stage.value}>
            {stage.icon} {stage.label}
          </option>
        ))}
      </select>
      
      <div className="stage-indicator" style={{ backgroundColor: currentStageData?.color }} />
    </div>
  );
};

export default StageSelector;