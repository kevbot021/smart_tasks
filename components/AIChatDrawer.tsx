import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { Task } from '@/types'

interface AIChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  task: Task
  taskContext: {
    task: {
      id: string
      description: string
      category: string
      status: string
      created_at: string
      updated_at: string
      assigned_to: string
      created_by: string
    }
    subtasks: {
      description: string
      status: string
      created_at: string
      updated_at: string
    }[]
    metadata: {
      total_subtasks: number
      completed_subtasks: number
      category: string
      has_deadline: boolean
    }
  }
}

interface AIResponse {
  question: string
  options: string[]
  assessment: 'ready' | 'not_ready' | 'continuing'
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
      console.log('Starting conversation with task context:', taskContext);
      
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskContext: {
            task: {
              description: taskContext.task.description,
              category: taskContext.task.category,
              status: taskContext.task.status,
              assigned_to: taskContext.task.assigned_to,
              created_by: taskContext.task.created_by
            },
            subtasks: taskContext.subtasks.map(st => ({
              description: st.description,
              status: st.status
            })),
            metadata: {
              total_subtasks: taskContext.metadata.total_subtasks,
              completed_subtasks: taskContext.metadata.completed_subtasks,
              category: taskContext.metadata.category
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      console.log('Received initial response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      setThreadId(data.threadId);
      try {
        const parsedMessage = JSON.parse(data.message) as AIResponse;
        console.log('Parsed response:', parsedMessage);
        setCurrentResponse(parsedMessage);
        setChatHistory([parsedMessage]);
      } catch (e) {
        console.error('Error parsing AI response:', e);
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, threadId, taskContext]);

  const handleOptionSelect = async (option: string) => {
    if (!threadId || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending option with context:', { option, taskContext });
      
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          message: option,
          taskContext: {
            task: taskContext.task,
            subtasks: taskContext.subtasks,
            metadata: taskContext.metadata
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('Received response for option:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      const parsedMessage = JSON.parse(data.message) as AIResponse;
      console.log('Parsed option response:', parsedMessage);
      
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