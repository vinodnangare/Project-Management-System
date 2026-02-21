import React from 'react';
import type { TabsProps } from '../types/components/TabsProps';

export const TabContainer: React.FC<TabsProps> = ({ activeTab, onTabChange, children }) => {
  const tabs = ['details', 'subtasks', 'comments', 'activity'] as const;

  return (
    <div className="tab-container">
      <div className="tab-buttons">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>
      <div className="tab-content">{children}</div>
    </div>
  );
};

export default TabContainer;
