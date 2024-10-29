'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { createClient } from '@supabase/supabase-js'
import type { Task, Subtask } from '@/types'
import TaskDetailSkeleton from './loading'
import { motion } from 'framer-motion'
import AIChatDrawer from '@/components/AIChatDrawer'

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
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)

  useEffect(() => {
    const fetchTask = async () => {
      try {
        console.log('Fetching task details:', params.id)
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
        console.log('Task data received:', taskData)
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
    return <TaskDetailSkeleton />
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

        {task.cartoon_slides && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageLoading ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4">Task Visualization</h2>
            <div className="relative">
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}
              <img 
                src={task.cartoon_slides} 
                alt="Task visualization"
                className="w-full rounded-lg shadow-lg"
                onLoad={() => setIsImageLoading(false)}
                style={{ opacity: isImageLoading ? 0 : 1 }}
              />
            </div>
          </motion.div>
        )}

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

      {task && (
        <AIChatDrawer
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          task={task}
        />
      )}
    </motion.div>
  )
} 