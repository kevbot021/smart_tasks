import { useState, useEffect } from 'react';
import type { TaskContext } from '@/types';

interface AIResponse {
  question: string;
  options: string[];
  assessment: 'continuing' | 'complete';
  confidence_score: number;
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
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
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

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
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
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800 font-medium">{currentResponse.question}</p>
          </div>
          <div className="space-y-2">
            {currentResponse.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isLoading}
                className={`w-full text-left p-3 rounded-lg border border-gray-200 
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} 
                  transition-colors`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 