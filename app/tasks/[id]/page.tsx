'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { createClient } from '@supabase/supabase-js'
import type { Task, Subtask } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TaskWithAssigner extends Task {
  assigner?: {
    name: string
  }
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [task, setTask] = useState<TaskWithAssigner | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select(`
            *,
            sub_tasks (*),
            assigner:created_by_user_id (name)
          `)
          .eq('id', params.id)
          .single()

        if (taskError) throw taskError
        setTask(taskData)
      } catch (error) {
        console.error('Error fetching task:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTask()
  }, [params.id])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!task) {
    return <div>Task not found</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button 
        onClick={() => router.back()}
        variant="ghost"
        className="mb-6"
      >
        ← Back
      </Button>

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{task.description}</h1>
          <p className="text-gray-500">
            Assigned by: {task.assigner?.name || 'Unknown'}
          </p>
        </div>

        {task.cartoon_slides && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Task Visualization</h2>
            <img 
              src={task.cartoon_slides} 
              alt="Task visualization"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}

        {task.sub_tasks && task.sub_tasks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Subtasks</h2>
            <div className="space-y-3">
              {task.sub_tasks.map((subtask) => (
                <div 
                  key={subtask.id}
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow"
                >
                  <input
                    type="checkbox"
                    checked={subtask.is_complete}
                    onChange={async () => {
                      try {
                        await supabase
                          .from('sub_tasks')
                          .update({ is_complete: !subtask.is_complete })
                          .eq('id', subtask.id)

                        // Update local state
                        setTask(prev => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            sub_tasks: prev.sub_tasks?.map(st =>
                              st.id === subtask.id
                                ? { ...st, is_complete: !st.is_complete }
                                : st
                            )
                          }
                        })
                      } catch (error) {
                        console.error('Error updating subtask:', error)
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <span className={subtask.is_complete ? 'line-through text-gray-400' : ''}>
                    {subtask.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 