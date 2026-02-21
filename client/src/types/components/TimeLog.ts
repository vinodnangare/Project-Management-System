export interface TimeLog {
  id: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  task_id: string | null;
  hours_worked: number;
  date: string;
  description: string | null;
  created_at: string;
}
