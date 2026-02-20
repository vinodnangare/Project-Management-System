export interface TimeLog {
  id: string;
  user_id: string;
  full_name: string;
  task_id: string | null;
  hours_worked: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
