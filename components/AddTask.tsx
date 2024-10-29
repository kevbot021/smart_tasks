import React, { useState } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import type { Task } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AddTaskProps {
  onAddTask: (task: Task) => void
  userId: string
  teamId: string
}

export default function AddTask({ onAddTask, userId, teamId }: AddTaskProps) {
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !teamId || isSubmitting) return
    
    setIsSubmitting(true)

    try {
      // 1. Create the initial task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          description,
          is_complete: false,
          category: 'Processing...',
          assigned_user_id: null,
          created_by_user_id: userId,
          team_id: teamId,
        })
        .select()
        .single();

      if (taskError) throw taskError;
      if (!taskData) throw new Error('No task data returned');

      // Initialize task with all fields to prevent UI changes
      let currentTask = {
        ...taskData,
        sub_tasks: [],
        audio_summary: undefined,
        cartoon_slides: undefined,
      };
      
      // Add task to UI once
      onAddTask(currentTask);

      // 2. Generate text content (category and subtasks)
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/generate-task-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          taskDescription: description,
          taskId: taskData.id,
          teamId: teamId,
          stage: 'text'
        })
      });

      if (!response.ok) throw new Error('Failed to generate task details');
      
      const data = await response.json();
      
      // Update our task object
      currentTask = {
        ...currentTask,
        category: data.category,
        sub_tasks: data.subtasks,
      };
      
      // Update UI with new data
      onAddTask(currentTask);

      // 3. Generate media content in the background
      const mediaResponse = await fetch('/api/generate-task-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          taskDescription: description,
          taskId: taskData.id,
          teamId: teamId,
          stage: 'media',
          subtasks: data.subtasks,
          category: data.category
        })
      });

      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        
        // Final update with all content
        currentTask = {
          ...currentTask,
          audio_summary: mediaData.audio_summary,
          cartoon_slides: mediaData.cartoon_slides,
        };
        
        onAddTask(currentTask);
      }

      setDescription('');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 relative">
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a new task..."
        className="min-h-[100px] bg-white pr-12"
        disabled={isSubmitting}
      />
      <Button 
        type="submit" 
        size="icon"
        className="absolute bottom-4 right-4 rounded-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}
