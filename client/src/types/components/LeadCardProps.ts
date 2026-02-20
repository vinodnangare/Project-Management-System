import type { Lead } from './Lead';

export interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  onStageChange?: (newStage: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}
