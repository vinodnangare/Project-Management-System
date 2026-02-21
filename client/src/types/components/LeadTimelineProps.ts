export interface TimelineEvent {
  id: string;
  type: 'created' | 'stage_change' | 'note' | 'email' | 'call' | 'meeting' | 'updated';
  title: string;
  description?: string;
  user_name?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LeadTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}
