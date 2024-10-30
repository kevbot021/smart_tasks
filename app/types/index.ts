export interface Task {
  id: string;
  description: string;
  is_complete: boolean;
  category?: string;
  assigned_user_id?: string;
  created_by_user_id?: string;
  team_id: string;
  created_at: string;
  sub_tasks?: {
    id: string;
    description: string;
    is_complete: boolean;
  }[];
} 