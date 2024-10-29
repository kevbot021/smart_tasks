import React, { useState } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AddTaskProps {
  onAddTask: (task: Task) => void
  userId: string
  teamId: string
}

interface Task {
  id: string
  description: string
  is_complete: boolean
  category: string
  assigned_user_id: string | null
  created_by_user_id: string
  team_id: string
}

export default function AddTask({ onAddTask, userId, teamId }: AddTaskProps) {
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    if (!teamId) {
      console.error('Team ID is not set');
      return;
    }

    try {
      // Create the task first
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          description,
          is_complete: false,
          category: 'Uncategorized',
          assigned_user_id: null,
          created_by_user_id: userId,
          team_id: teamId,
        })
        .select()
        .single();

      if (taskError) {
        console.error('Error creating task:', taskError);
        return;
      }

      if (!taskData) {
        console.error('No task data returned');
        return;
      }

      // Get the session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      // Generate subtasks, category, and audio
      const response = await fetch('/api/generate-task-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          taskDescription: description,
          taskId: taskData.id,
          teamId: teamId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to generate task details:', errorData);
        onAddTask(taskData);
      } else {
        const data = await response.json();
        console.log('Generated task details:', data);
        
        // Create an updated task object with all the new data
        const updatedTaskData = {
          ...taskData,
          category: data.category,
          sub_tasks: data.subtasks,
          audio_summary: data.audio_summary
        };

        // Add the updated task to the UI
        onAddTask(updatedTaskData);
      }

      setDescription('');

    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 relative">
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a new task..."
        className="min-h-[100px] bg-white pr-12"
      />
      <Button 
        type="submit" 
        size="icon"
        className="absolute bottom-4 right-4 rounded-full"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  )
}
