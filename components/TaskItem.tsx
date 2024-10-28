import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Trash2, Play, Pause, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getColorForCategory } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Subtask {
  id: string
  task_id: string
  description: string
  is_complete: boolean
}

interface Task {
  id: string
  description: string
  is_complete: boolean
  category: string
  assigned_user_id: string | null
  created_by_user_id: string
  team_id: string
  sub_tasks?: Subtask[]
  audio_summary?: string
}

interface TeamMember {
  id: string
  name: string
}

interface TaskItemProps {
  task: Task
  teamMembers: TeamMember[]
  isAdmin: boolean
  onToggleComplete: (taskId: string, isComplete: boolean) => Promise<void>
  onToggleSubtaskComplete: (subtaskId: string, isComplete: boolean) => Promise<void>
  onAssignTask: (taskId: string, userId: string) => Promise<void>
  onUpdateTask: (taskId: string, newDescription: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
}

export default function TaskItem({
  task,
  teamMembers,
  isAdmin,
  onToggleComplete,
  onToggleSubtaskComplete,
  onAssignTask,
  onUpdateTask,
  onDeleteTask
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(true)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (task.audio_summary) {
      setIsAudioLoading(true)
      setAudioLoaded(false)

      // Create new audio element
      const audio = new Audio()
      audio.src = `data:audio/mp3;base64,${task.audio_summary}`

      // Add event listeners
      audio.addEventListener('canplaythrough', () => {
        setIsAudioLoading(false)
        setAudioLoaded(true)
      })

      audio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e)
        setIsAudioLoading(false)
        setAudioLoaded(false)
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
      })

      // Store audio element in ref
      audioRef.current = audio

      // Cleanup
      return () => {
        audio.pause()
        audio.src = ''
        audio.removeEventListener('canplaythrough', () => {})
        audio.removeEventListener('error', () => {})
        audio.removeEventListener('ended', () => {})
        audioRef.current = null
      }
    }
  }, [task.audio_summary])

  const handlePlayAudio = () => {
    if (!audioRef.current || !audioLoaded) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          console.error('Error playing audio:', error)
          setIsPlaying(false)
        })
    }
  }

  const categoryColor = getColorForCategory(task.category)

  return (
    <div className="py-2">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 p-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <input
          type="checkbox"
          checked={task.is_complete}
          onChange={() => onToggleComplete(task.id, !task.is_complete)}
          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className={`text-xl font-medium flex-grow ${task.is_complete ? 'line-through text-gray-400' : ''}`}>
          {task.description}
        </span>
        <div className="flex items-center space-x-2">
          {task.audio_summary && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePlayAudio}
              disabled={isAudioLoading || !audioLoaded}
              className={isAudioLoading ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isAudioLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}
          <Badge 
            variant="outline" 
            className={`${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
          >
            {task.category}
          </Badge>
          {isAdmin && (
            <Select
              value={task.assigned_user_id || 'unassigned'}
              onValueChange={(value) => onAssignTask(task.id, value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isAdmin && (
            <Button 
              onClick={() => onDeleteTask(task.id)}
              variant="ghost" 
              size="sm" 
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {expanded && task.sub_tasks && task.sub_tasks.length > 0 && (
        <div className="mt-4 ml-12 space-y-2">
          {task.sub_tasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={subtask.is_complete}
                onChange={() => onToggleSubtaskComplete(subtask.id, !subtask.is_complete)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className={`text-lg ${subtask.is_complete ? 'line-through text-gray-400' : ''}`}>
                {subtask.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
