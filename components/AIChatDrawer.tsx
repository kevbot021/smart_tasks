import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { Task } from '@/types'

interface TaskContext {
  task: {
    description: string
    category: string
    status: string
  }
  subtasks: {
    description: string
    status: string
  }[]
}

interface AIChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  task: Task
  taskContext: TaskContext
}

interface AIResponse {
  question: string
  options: string[]
  assessment: 'continuing' | 'ready'
  confidence_score: number
}

export default function AIChatDrawer({ isOpen, onClose, task, taskContext }: AIChatDrawerProps) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null)
  const [chatHistory, setChatHistory] = useState<AIResponse[]>([])
  const [error, setError] = useState<string | null>(null)

  const startConversation = useCallback(async () => {
    if (!isOpen || threadId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const taskContext = {
        task: {
          description: task.description,
          category: task.category || 'General',
          status: task.is_complete ? 'completed' : 'in progress',
        },
        subtasks: task.sub_tasks?.map(st => ({
          description: st.description,
          status: st.is_complete ? 'completed' : 'pending'
        })) || []
      };

      const response = await fetch('/api/generate-task-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskContext })
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setThreadId(data.threadId);
      const parsedMessage = JSON.parse(data.message) as AIResponse;
      setCurrentResponse(parsedMessage);
      setChatHistory([parsedMessage]);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, threadId, task]);

  const handleOptionSelect = async (option: string) => {
    if (!threadId || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-task-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          message: option,
          taskContext: {
            task: {
              description: task.description,
              category: task.category || 'General',
              status: task.is_complete ? 'completed' : 'in progress',
            },
            subtasks: task.sub_tasks?.map(st => ({
              description: st.description,
              status: st.is_complete ? 'completed' : 'pending'
            })) || []
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const parsedMessage = JSON.parse(data.message) as AIResponse;
      setCurrentResponse(parsedMessage);
      setChatHistory(prev => [...prev, parsedMessage]);

      if (parsedMessage.assessment === 'ready' && parsedMessage.confidence_score > 80) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error handling option:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !threadId && !isLoading) {
      startConversation();
    }
  }, [isOpen, threadId, isLoading, startConversation]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setThreadId(null);
      setCurrentResponse(null);
      setChatHistory([]);
      setError(null);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right"
        className="w-[400px] sm:w-[540px]"
      >
        <SheetHeader>
          <SheetTitle>AI Task Assistant</SheetTitle>
          <p className="text-sm text-muted-foreground">
            AI assistant to help you understand your task better
          </p>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          <div className="space-y-6">
            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="space-y-4">
                {chatHistory.map((response, index) => (
                  <div 
                    key={`history-${index}`} 
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <p className="font-medium text-gray-700">
                      {response.question}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Current Question */}
            {!isLoading && currentResponse && (
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <p className="font-medium text-gray-900 mb-4">
                  {currentResponse.question}
                </p>
                <div className="space-y-2">
                  {currentResponse.options?.map((option, index) => (
                    <Button
                      key={`option-${index}`}
                      variant="outline"
                      className="w-full justify-start text-left hover:bg-gray-50"
                      onClick={() => handleOptionSelect(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 