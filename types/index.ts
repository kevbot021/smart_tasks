export interface User {
  id: string;
  name: string;
  email: string;
}

export interface TeamMember {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  description: string;
  is_complete: boolean;
  category: string;
  assigned_user_id: string | null;
  team_id: string;
  created_at: string;
  created_by_user_id: string;
  audio_summary?: string;
  image?: string;
  sub_tasks?: Subtask[];
  cartoon_slides?: string;
  assigner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Subtask {
  id: string;
  description: string;
  is_complete: boolean;
  task_id: string;
}

export interface TaskContext {
  task: {
    description: string
    category: string
    status: string
  }
  subtasks: {
    description: string
    status: string
  }[]
}

export interface AIResponse {
  question: string
  options: string[]
  assessment: 'continuing' | 'ready'
  confidence_score: number
} 