import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ChevronDown, ChevronUp, Trash2, Play, Pause, Image } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getColorForCategory } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import type { Task, Subtask } from '@/types'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (task.audio_summary) {
      setIsAudioLoading(true)
      setAudioLoaded(false)

      const audio = new Audio()
      audio.src = `data:audio/mp3;base64,${task.audio_summary}`

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

      audioRef.current = audio

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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePlayAudio}
            disabled={isAudioLoading || !audioLoaded}
            className={`transition-opacity ${isAudioLoading || !audioLoaded ? 'opacity-40' : 'opacity-100'}`}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                disabled={!task.cartoon_slides}
                className={`transition-opacity ${!task.cartoon_slides ? 'opacity-40' : 'opacity-100'}`}
              >
                <Image className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            {task.cartoon_slides && (
              <DialogContent className="max-w-4xl">
                <img 
                  src={task.cartoon_slides} 
                  alt="Task visualization" 
                  className="w-full h-auto rounded-lg"
                />
              </DialogContent>
            )}
          </Dialog>
          <Badge 
            variant="outline" 
            className={`${categoryColor.bg} ${categoryColor.text} ${categoryColor.border} ${
              task.category === 'Processing...' ? 'opacity-40' : 'opacity-100'
            }`}
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
