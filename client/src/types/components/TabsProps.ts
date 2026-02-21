export interface TabsProps {
  activeTab: 'details' | 'subtasks' | 'comments' | 'activity';
  onTabChange: (tab: 'details' | 'subtasks' | 'comments' | 'activity') => void;
  children: React.ReactNode;
}
