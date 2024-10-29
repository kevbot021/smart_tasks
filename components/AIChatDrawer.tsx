import { useState, useEffect, useCallback } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  const parseAIResponse = (message: string): AIResponse => {
    try {
      const parsed = JSON.parse(message);
      // Validate the response has the required fields
      if (!parsed.question || !Array.isArray(parsed.options)) {
        throw new Error('Invalid response format');
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing AI response:', e, 'Raw message:', message);
      throw new Error('Failed to parse AI response');
    }
  };

  const startConversation = useCallback(async () => {
    if (!isOpen || threadId) return;
    
    setIsLoading(true);
    setError(null);
    
    const timeoutId = setTimeout(() => {
      setError('Request is taking longer than expected. Please try again.');
      setIsLoading(false);
    }, 30000); // 30 second timeout

    try {
      console.log('Starting conversation with task:', task);
      
      const taskContext = {
        description: task.description,
        sub_tasks: task.sub_tasks?.map(st => st.description),
      };

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskContext,
        }),
      });

      const data = await response.json();
      console.log('Received response:', data);

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to start conversation');
      }

      setThreadId(data.threadId);
      const parsedResponse = parseAIResponse(data.message);
      console.log('Parsed response:', parsedResponse);
      
      setCurrentResponse(parsedResponse);
      setChatHistory([parsedResponse]);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [isOpen, threadId, task]);

  useEffect(() => {
    if (isOpen && !threadId && !isLoading) {
      startConversation();
    }
  }, [isOpen, threadId, isLoading, startConversation]);

  const handleOptionSelect = async (option: string) => {
    if (!threadId || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending option:', option);
      
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          message: option,
        }),
      });

      const data = await response.json();
      console.log('Received response for option:', data);

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to send message');
      }

      const parsedResponse = parseAIResponse(data.message);
      console.log('Parsed option response:', parsedResponse);
      
      setCurrentResponse(parsedResponse);
      setChatHistory(prev => [...prev, parsedResponse]);

      if (parsedResponse.assessment === 'ready' && parsedResponse.confidence_score > 80) {
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