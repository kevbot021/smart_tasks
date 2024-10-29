'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { createClient } from '@supabase/supabase-js'
import type { Task, TaskContext } from '@/types'
import AIChatDrawer from '@/components/AIChatDrawer'
import { motion } from 'framer-motion'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [taskContext, setTaskContext] = useState<TaskContext | null>(null)

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select(`
            *,
            sub_tasks (*),
            assigner:created_by_user_id (
              id,
              name,
              email
            ),
            assigned_user:assigned_user_id (
              id,
              name,
              email
            )
          `)
          .eq('id', params.id)
          .single()

        if (taskError) throw taskError

        // Format context for AI
        const aiContext: TaskContext = {
          task: {
            description: taskData.description,
            category: taskData.category || 'General',
            status: taskData.is_complete ? 'completed' : 'in progress'
          },
          subtasks: taskData.sub_tasks?.map((st: any) => ({
            description: st.description,
            status: st.is_complete ? 'completed' : 'pending'
          })) || []
        }

        setTask(taskData)
        setTaskContext(aiContext)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching task details:', error)
        setIsLoading(false)
      }
    }

    fetchTaskDetails()
  }, [params.id])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-gray-800">Task not found</h1>
        <Button 
          onClick={() => router.back()}
          variant="ghost"
          className="mt-4"
        >
          ← Go Back
        </Button>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto p-6 max-w-2xl"
    >
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={() => router.back()}
          variant="ghost"
        >
          ← Back
        </Button>
        
        <Button
          onClick={() => setIsAIChatOpen(true)}
          variant="default"
          className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
        >
          Get Help with AI
        </Button>
      </div>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold mb-2">{task.description}</h1>
          <p className="text-gray-500">
            Assigned by: {task.assigner?.name || 'Unknown'}
          </p>
        </motion.div>

        {task.sub_tasks && task.sub_tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold mb-4">Subtasks</h2>
            <div className="space-y-3">
              {task.sub_tasks.map((subtask, index) => (
                <motion.div 
                  key={subtask.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
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
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className={`flex-grow ${subtask.is_complete ? 'line-through text-gray-400' : ''}`}>
                    {subtask.description}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {task && taskContext && (
        <AIChatDrawer
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          task={task}
          taskContext={taskContext}
        />
      )}
    </motion.div>
  )
} 