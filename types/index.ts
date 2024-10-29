export interface User {
  id: string
  name: string
  email: string
}

export interface Subtask {
  id: string
  description: string
  is_complete: boolean
  task_id: string
  created_at?: string
  updated_at?: string
}

export interface Task {
  id: string
  description: string
  is_complete: boolean
  category?: string
  assigned_user_id?: string | null
  created_by_user_id: string
  team_id: string
  audio_summary?: string
  cartoon_slides?: string
  created_at?: string
  updated_at?: string
  sub_tasks?: Subtask[]
  assigner?: User
  assigned_user?: User
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