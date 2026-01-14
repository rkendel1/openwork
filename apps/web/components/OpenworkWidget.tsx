'use client';

import { useState, useEffect } from 'react';
import { getOpenworkAPI } from '@/lib/openwork-api';
import type { OpenworkWebAPI } from '@/lib/openwork-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Task, TaskUpdateEvent } from '@accomplish/shared';

export interface OpenworkWidgetProps {
  /**
   * Base URL for the Openwork API
   * If not provided, uses the same origin
   */
  apiBaseUrl?: string;
  
  /**
   * Custom className for the widget container
   */
  className?: string;
  
  /**
   * Callback when a task is started
   */
  onTaskStart?: (task: Task) => void;
  
  /**
   * Callback when a task completes
   */
  onTaskComplete?: (task: Task) => void;
  
  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * OpenworkWidget - Embeddable task creation widget
 * 
 * This component can be embedded in any Next.js application to provide
 * Openwork task creation functionality.
 * 
 * @example
 * ```tsx
 * import { OpenworkWidget } from '@accomplish/web';
 * 
 * export default function MyPage() {
 *   return (
 *     <OpenworkWidget
 *       apiBaseUrl="https://your-api.com"
 *       onTaskStart={(task) => console.log('Task started:', task)}
 *     />
 *   );
 * }
 * ```
 */
export function OpenworkWidget({
  apiBaseUrl,
  className = '',
  onTaskStart,
  onTaskComplete,
  onError,
}: OpenworkWidgetProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [api, setApi] = useState<OpenworkWebAPI | null>(null);

  useEffect(() => {
    // Initialize API client only on the client side
    setApi(getOpenworkAPI(apiBaseUrl));
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!api) return;
    
    // Subscribe to task updates
    const unsubscribe = api.onTaskUpdate((event: TaskUpdateEvent) => {
      if (currentTask && event.taskId === currentTask.id) {
        // Update task state based on event type
        const updatedTask = { ...currentTask };
        
        if (event.type === 'message' && event.message) {
          updatedTask.messages = [...updatedTask.messages, event.message];
        } else if (event.type === 'complete') {
          updatedTask.status = 'completed';
          if (event.result) {
            updatedTask.result = event.result;
          }
          if (updatedTask.completedAt === undefined) {
            updatedTask.completedAt = new Date().toISOString();
          }
          if (onTaskComplete) {
            onTaskComplete(updatedTask);
          }
        } else if (event.type === 'error') {
          updatedTask.status = 'failed';
          if (event.result) {
            updatedTask.result = event.result;
          }
        }
        
        setCurrentTask(updatedTask);
      }
    });

    return () => unsubscribe();
  }, [api, currentTask, onTaskComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || !api) return;

    setIsLoading(true);
    try {
      const task = await api.startTask({
        taskId: `task_${Date.now()}`,
        prompt: prompt.trim(),
        workingDirectory: '/',
      });
      
      setCurrentTask(task);
      setPrompt('');
      
      if (onTaskStart) {
        onTaskStart(task);
      }
    } catch (error) {
      console.error('Failed to start task:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-2">
                What would you like me to do?
              </label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Sort my desktop files by type, create a summary of my recent documents, etc."
                className="min-h-32 resize-none"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {currentTask && (
                  <span>
                    Current task: <span className="font-medium">{currentTask.status}</span>
                  </span>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                size="lg"
              >
                {isLoading ? 'Starting...' : 'Start Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
