export interface UpcomingDeadline {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
}

export interface EmployeeDashboardStats {
  totalTasks: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksTodo: number;
  tasksInReview: number;
  tasksOverdue: number;
  tasksDueToday: number;
  hoursWorked: number;
  completionRate: number;
  upcomingDeadlines: UpcomingDeadline[];
}
