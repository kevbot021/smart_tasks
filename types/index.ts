export interface Subtask {
  id: string
  task_id: string
  description: string
  is_complete: boolean
}

export interface Task {
  id: string
  description: string
  is_complete: boolean
  category: string
  assigned_user_id: string | null
  created_by_user_id: string
  team_id: string
  audio_summary?: string
  cartoon_slides?: string
  sub_tasks?: Subtask[]
} 