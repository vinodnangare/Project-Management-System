import React from 'react';
import '../styles/components/StageSelector.css';
import type { StageSelectorProps } from '../types/components/StageSelectorProps';
import { useGetLeadStagesQuery } from '../services/api';

const StageSelector: React.FC<StageSelectorProps> = ({
  currentStage,
  onChange,
  disabled = false,
  size = 'medium',
}) => {
  const { data: stagesData = [] } = useGetLeadStagesQuery();

  const stages = stagesData.map(s => ({
    value: s.name,
    label: s.name.charAt(0).toUpperCase() + s.name.slice(1).replace('_', ' '),
    color: s.color,
    icon: '' // You could map icons like in LeadPipeline or remove this prop if unused
  }));

  const currentStageData = stages.find(s => s.value === currentStage) || stages[0];

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