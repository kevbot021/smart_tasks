import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { Task } from '@/types'

interface AIChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  task: Task
}

interface AIResponse {
  question: string
  options: string[]
  assessment: 'ready' | 'not_ready' | 'continuing'
  confidence_score: number
}

export default function AIChatDrawer({ isOpen, onClose, task }: AIChatDrawerProps) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null)
  const [chatHistory, setChatHistory] = useState<AIResponse[]>([])

  useEffect(() => {
    if (isOpen && !threadId) {
      startConversation()
    }
  }, [isOpen, task])

  const startConversation = async () => {
    setIsLoading(true)
    try {
      const taskContext = {
        description: task.description,
        sub_tasks: task.sub_tasks,
      }

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskContext,
        }),
      })

      const data = await response.json()
      setThreadId(data.threadId)
      const parsedMessage = JSON.parse(data.message) as AIResponse
      setCurrentResponse(parsedMessage)
      setChatHistory([parsedMessage])
    } catch (error) {
      console.error('Error starting conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = async (option: string) => {
    if (!threadId || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          message: option,
        }),
      })

      const data = await response.json()
      const parsedMessage = JSON.parse(data.message) as AIResponse
      setCurrentResponse(parsedMessage)
      setChatHistory(prev => [...prev, parsedMessage])

      if (parsedMessage.assessment === 'ready' && parsedMessage.confidence_score > 80) {
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>AI Task Assistant</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Chat History */}
              <div className="space-y-4 mb-6">
                {chatHistory.map((response, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium mb-3">{response.question}</p>
                  </div>
                ))}
              </div>

              {/* Current Question */}
              {currentResponse && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="font-medium mb-4">{currentResponse.question}</p>
                  <div className="space-y-2">
                    {currentResponse.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left"
                        onClick={() => handleOptionSelect(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 