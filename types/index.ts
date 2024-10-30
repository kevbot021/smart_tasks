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
  category?: string;
  assigned_user_id: string | null;
  created_by_user_id?: string;
  team_id: string;
  created_at: string;
  audio_summary?: string;
  image?: string;
  cartoon_slides?: string;
  assigner?: {
    id: string;
    name: string;
    email: string;
  };
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  sub_tasks?: Subtask[];
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

export interface Invitation {
  id: string;
  team_id: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  teams?: {
    name: string;
  };
}

export interface PendingInvite {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
} 