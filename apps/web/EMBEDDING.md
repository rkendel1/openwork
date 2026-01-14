# Embedding Openwork in Your Next.js App

This guide shows how to embed the Openwork widget in your Next.js application.

## Quick Start

### Step 1: Install Dependencies

If you're in the monorepo:

```json
// package.json
{
  "dependencies": {
    "@accomplish/web": "workspace:*",
    "@accomplish/shared": "workspace:*"
  }
}
```

If using as a published package (future):

```bash
npm install @accomplish/web
```

### Step 2: Configure Tailwind

Update your `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Add Openwork components
    './node_modules/@accomplish/web/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Add Openwork theme colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... (see apps/web/tailwind.config.ts for full theme)
      },
    },
  },
};

export default config;
```

### Step 3: Add CSS Variables

Add to your global CSS (e.g., `app/globals.css`):

```css
:root {
  --background: 0 0% 97.6%;
  --foreground: 0 0% 12.5%;
  --card: 0 0% 98.8%;
  --card-foreground: 0 0% 12.5%;
  --primary: 123 30% 20%;
  --primary-foreground: 0 0% 100%;
  --muted: 0 0% 93.7%;
  --muted-foreground: 0 0% 39.2%;
  --border: 12 8% 90%;
  --radius: 0.5rem;
}
```

### Step 4: Use the Widget

Create a page with the Openwork widget:

```tsx
// app/tasks/page.tsx
'use client';

import { OpenworkWidget } from '@accomplish/web';
import type { Task } from '@accomplish/web';

export default function TasksPage() {
  const handleTaskStart = (task: Task) => {
    console.log('Task started:', task);
    // Optionally update your app state
  };

  const handleTaskComplete = (task: Task) => {
    console.log('Task completed:', task);
    // Optionally show a notification
  };

  const handleError = (error: Error) => {
    console.error('Task error:', error);
    // Optionally show an error message
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">AI Tasks</h1>
      
      <OpenworkWidget
        apiBaseUrl={process.env.NEXT_PUBLIC_OPENWORK_API}
        onTaskStart={handleTaskStart}
        onTaskComplete={handleTaskComplete}
        onError={handleError}
        className="max-w-4xl mx-auto"
      />
    </div>
  );
}
```

## Advanced Examples

### Example 1: Dashboard with Task List

```tsx
'use client';

import { useState } from 'react';
import { OpenworkWidget } from '@accomplish/web';
import type { Task } from '@accomplish/web';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
      {/* Task Creator */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
        <OpenworkWidget
          onTaskStart={(task) => setTasks(prev => [...prev, task])}
          onTaskComplete={(task) => {
            setTasks(prev =>
              prev.map(t => t.id === task.id ? task : t)
            );
          }}
        />
      </div>

      {/* Task List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Tasks</h2>
        <div className="space-y-2">
          {tasks.map(task => (
            <div
              key={task.id}
              className="p-4 bg-card rounded-lg border"
            >
              <div className="font-medium">{task.config.prompt}</div>
              <div className="text-sm text-muted-foreground">
                Status: {task.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Modal/Dialog Integration

```tsx
'use client';

import { useState } from 'react';
import { OpenworkWidget } from '@accomplish/web';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create AI Task</Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl">
        <OpenworkWidget
          onTaskStart={(task) => {
            console.log('Task started:', task);
            setOpen(false); // Close modal after starting
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### Example 3: Using the API Client Directly

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getOpenworkAPI } from '@accomplish/web';
import type { Task } from '@accomplish/web';

export default function CustomTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [api] = useState(() => getOpenworkAPI());

  useEffect(() => {
    // Load existing tasks
    api.listTasks().then(setTasks);

    // Subscribe to updates
    const unsubscribe = api.onTaskUpdate((event) => {
      console.log('Task update:', event);
      // Handle task updates
    });

    return () => unsubscribe();
  }, [api]);

  const startCustomTask = async () => {
    const task = await api.startTask({
      taskId: `task_${Date.now()}`,
      prompt: 'Custom task from API',
      workingDirectory: '/',
    });
    
    setTasks(prev => [...prev, task]);
  };

  return (
    <div className="p-8">
      <button onClick={startCustomTask}>
        Start Custom Task
      </button>
      
      <div className="mt-4">
        {tasks.map(task => (
          <div key={task.id}>{task.config.prompt}</div>
        ))}
      </div>
    </div>
  );
}
```

## Environment Variables

Create a `.env.local` file:

```env
# API endpoint (optional - defaults to same origin)
NEXT_PUBLIC_OPENWORK_API=http://localhost:3001

# Or in production:
# NEXT_PUBLIC_OPENWORK_API=https://api.yourapp.com
```

## Backend Setup

You need a backend to handle task execution. Options:

### Option 1: Use Included API Routes

The `@accomplish/web` package includes Next.js API routes. They'll work automatically if you're using the standalone app.

### Option 2: Separate Backend

Create your own backend that implements the Openwork API:

- `POST /api/tasks/start` - Start a task
- `GET /api/tasks/:id` - Get task status
- `POST /api/tasks/:id/cancel` - Cancel a task
- `WS /api/ws` - WebSocket for real-time updates

See the API client (`lib/openwork-api.ts`) for the full API specification.

## TypeScript Support

All types are exported:

```typescript
import type {
  Task,
  TaskConfig,
  TaskStatus,
  TaskUpdateEvent,
  PermissionRequest,
  PermissionResponse,
} from '@accomplish/web';
```

## Troubleshooting

### Styles Not Working

Make sure:
1. Tailwind content includes `@accomplish/web`
2. CSS variables are defined in your global CSS
3. The `globals.css` is imported in your root layout

### API Errors

Check:
1. `apiBaseUrl` is correctly set
2. Backend is running and accessible
3. CORS is configured if using a separate backend

### TypeScript Errors

Ensure:
1. `@accomplish/shared` is installed
2. TypeScript version is compatible (>= 5.0)
3. Module resolution is set to `bundler` or `node16`

## Next Steps

- Customize the widget styling
- Implement your backend API
- Add authentication and authorization
- Set up task persistence
- Configure notification system
