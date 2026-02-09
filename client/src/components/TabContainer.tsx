import React from 'react';

interface TabsProps {
  activeTab: 'details' | 'subtasks' | 'comments' | 'activity';
  onTabChange: (tab: 'details' | 'subtasks' | 'comments' | 'activity') => void;
  children: React.ReactNode;
}

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
