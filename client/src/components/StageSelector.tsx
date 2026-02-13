import React from 'react';
import '../styles/components/StageSelector.css';

interface StageSelectorProps {
  currentStage: string;
  onChange: (stage: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const stages = [
  { value: 'new', label: 'New', color: '#3b82f6', icon: '🆕' },
  { value: 'qualified', label: 'Qualified', color: '#8b5cf6', icon: '✅' },
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b', icon: '🔄' },
  { value: 'won', label: 'Won', color: '#10b981', icon: '🎉' },
  { value: 'lost', label: 'Lost', color: '#ef4444', icon: '❌' },
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