import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import type { Task } from '@/types'

interface TaskCardProps {
  task: Task
  assignerName?: string // Name of the person who assigned the task
}

export default function TaskCard({ task, assignerName }: TaskCardProps) {
  const router = useRouter()

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{task.description}</h3>
            {assignerName && (
              <p className="text-sm text-gray-500">Assigned by: {assignerName}</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => router.push(`/tasks/${task.id}`)}
          className="w-full"
        >
          View Task
        </Button>
      </CardFooter>
    </Card>
  )
} 