export interface StageSelectorProps {
  currentStage: string;
  onChange: (stage: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}
