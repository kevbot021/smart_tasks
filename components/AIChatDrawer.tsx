import { useState, useEffect } from 'react';
import type { TaskContext } from '@/types';

interface AIResponse {
  question: string;
  options: string[];
  assessment: 'continuing' | 'complete';
  confidence_score: number;
}

interface Message {
  type: 'ai' | 'user';
  content: string;
  options?: string[];
}

const DEFAULT_RESPONSE: AIResponse = {
  question: "Analyzing your task...",
  options: [
    "Let's understand the main goal first",
    "Break it into smaller steps",
    "What resources do I need?"
  ],
  assessment: "continuing",
  confidence_score: 0
};

interface Props {
  taskContext: TaskContext;
  onClose: () => void;
}

export default function AIChatDrawer({ taskContext, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<AIResponse>(DEFAULT_RESPONSE);

  const startConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/generate-task-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskContext }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setThreadId(data.threadId);
      try {
        const parsedMessage = JSON.parse(data.message) as AIResponse;
        if (!parsedMessage.options || !Array.isArray(parsedMessage.options)) {
          throw new Error('Invalid response format');
        }
        setCurrentResponse(parsedMessage);
        setMessages([{
          type: 'ai',
          content: parsedMessage.question,
          options: parsedMessage.options
        }]);
      } catch (e) {
        console.error('Error parsing message:', e);
        setCurrentResponse(DEFAULT_RESPONSE);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = async (selectedOption: string) => {
    if (!threadId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Add user's selection to messages
      setMessages(prev => [...prev, {
        type: 'user',
        content: selectedOption
      }]);

      const response = await fetch('/api/generate-task-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          message: selectedOption,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      try {
        const parsedMessage = JSON.parse(data.message) as AIResponse;
        if (!parsedMessage.options || !Array.isArray(parsedMessage.options)) {
          throw new Error('Invalid response format');
        }
        setCurrentResponse(parsedMessage);
        
        // Add AI's response to messages
        setMessages(prev => [...prev, {
          type: 'ai',
          content: parsedMessage.question,
          options: parsedMessage.options
        }]);

        if (parsedMessage.assessment === 'complete') {
          setTimeout(onClose, 3000);
        }
      } catch (e) {
        console.error('Error parsing message:', e);
        setError('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error sending response:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startConversation();
  }, []);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">AI Task Assistant</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close panel</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            <p>{error}</p>
            <button 
              onClick={startConversation}
              className="mt-2 text-sm text-red-600 hover:text-red-500"
            >
              Try again
            </button>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`space-y-4 ${message.type === 'user' ? 'ml-4' : ''}`}>
              <div className={`p-4 rounded-lg ${
                message.type === 'ai' 
                  ? 'bg-gray-50' 
                  : 'bg-blue-50 ml-auto max-w-[80%]'
              }`}>
                <p className={`font-medium ${
                  message.type === 'ai' ? 'text-gray-800' : 'text-blue-800'
                }`}>
                  {message.content}
                </p>
              </div>
              
              {/* Show options only for the last AI message if not loading */}
              {message.type === 'ai' && 
               message.options && 
               index === messages.length - 1 && 
               !isLoading && (
                <div className="space-y-2 ml-4">
                  {message.options.map((option, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => handleOptionClick(option)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 
                        hover:bg-gray-50 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
} 