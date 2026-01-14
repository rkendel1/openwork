# @accomplish/web

Web version of Openwork that can be embedded in Next.js applications.

## Features

- 🌐 **Web-based**: Works in any modern browser
- ⚛️ **React Components**: Pre-built, embeddable components
- 🔌 **Easy Integration**: Drop into any Next.js app
- 🎨 **Customizable**: Fully styled with Tailwind CSS
- 📡 **Real-time Updates**: WebSocket-based task updates

## Installation

This package is part of the Openwork monorepo. To use it in your Next.js application:

### Option 1: Local Development (Monorepo)

1. From the monorepo root:
```bash
pnpm install
```

2. In your Next.js app's `package.json`:
```json
{
  "dependencies": {
    "@accomplish/web": "workspace:*"
  }
}
```

### Option 2: Published Package (Future)

```bash
npm install @accomplish/web
# or
pnpm add @accomplish/web
# or
yarn add @accomplish/web
```

## Quick Start

### Running the Standalone Web App

```bash
pnpm dev
```

This starts the Next.js development server on http://localhost:3000

### Embedding in Your Next.js App

1. **Import the Widget**:

```tsx
import { OpenworkWidget } from '@accomplish/web';
```

2. **Use in Your Component**:

```tsx
export default function MyPage() {
  return (
    <div className="container mx-auto p-8">
      <h1>My App with Openwork</h1>
      
      <OpenworkWidget
        apiBaseUrl="http://localhost:3001/api"
        onTaskStart={(task) => {
          console.log('Task started:', task);
        }}
        onTaskComplete={(task) => {
          console.log('Task completed:', task);
        }}
        onError={(error) => {
          console.error('Task error:', error);
        }}
      />
    </div>
  );
}
```

## API Configuration

The web version communicates with a backend API. You need to either:

1. **Use the built-in Next.js API routes** (included in this package)
2. **Point to a separate backend** by providing `apiBaseUrl`

### Built-in API Routes

The package includes Next.js API routes in the `app/api` directory that handle:

- Task management
- Permission handling
- Settings storage
- WebSocket connections

### Custom Backend

If you're running a separate backend, configure it:

```tsx
<OpenworkWidget apiBaseUrl="https://your-backend.com" />
```

## Components

### OpenworkWidget

Main component for creating and managing tasks.

**Props:**

- `apiBaseUrl?: string` - Base URL for the Openwork API
- `className?: string` - Custom CSS classes
- `onTaskStart?: (task: Task) => void` - Called when a task starts
- `onTaskComplete?: (task: Task) => void` - Called when a task completes
- `onError?: (error: Error) => void` - Called on errors

**Example:**

```tsx
<OpenworkWidget
  className="max-w-4xl mx-auto"
  apiBaseUrl="http://localhost:3001"
  onTaskStart={(task) => console.log('Started:', task.id)}
/>
```

## API Client

Use the API client directly for more control:

```tsx
import { getOpenworkAPI } from '@accomplish/web';

const api = getOpenworkAPI('http://localhost:3001');

// Start a task
const task = await api.startTask({
  taskId: 'my-task-1',
  prompt: 'Organize my files',
  workingDirectory: '/home/user/documents',
});

// Listen for updates
api.onTaskUpdate((event) => {
  console.log('Task update:', event);
});

// Get task status
const currentTask = await api.getTask(task.id);
```

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type { Task, TaskStatus, TaskUpdateEvent } from '@accomplish/web';
```

## Styling

The components use Tailwind CSS and are fully customizable. They inherit from your app's Tailwind configuration.

### Required Tailwind Setup

Ensure your `tailwind.config.ts` includes the web package:

```ts
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './node_modules/@accomplish/web/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of config
};
```

## Development

### Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (optional backend)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── OpenworkWidget.tsx # Main widget
├── lib/                   # Utilities
│   ├── openwork-api.ts   # API client
│   └── utils.ts          # Helpers
├── index.ts              # Package exports
└── package.json
```

### Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript checks
```

## Differences from Desktop App

| Feature | Desktop | Web |
|---------|---------|-----|
| **Distribution** | Electron app | React components |
| **Communication** | IPC | HTTP + WebSocket |
| **File Access** | Direct via Node.js | Server-side only |
| **API Keys** | OS Keychain | Server-side storage |
| **Updates** | Real-time via IPC | Real-time via WebSocket |

## Examples

### Basic Integration

```tsx
import { OpenworkWidget } from '@accomplish/web';

export default function TaskPage() {
  return (
    <div className="container">
      <OpenworkWidget />
    </div>
  );
}
```

### Advanced Integration with State Management

```tsx
'use client';

import { useState } from 'react';
import { OpenworkWidget } from '@accomplish/web';
import type { Task } from '@accomplish/web';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <h2>Create Task</h2>
        <OpenworkWidget
          onTaskStart={(task) => {
            setTasks(prev => [...prev, task]);
          }}
        />
      </div>
      
      <div>
        <h2>Active Tasks</h2>
        <ul>
          {tasks.map(task => (
            <li key={task.id}>
              {task.id} - {task.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### With Custom Styling

```tsx
<OpenworkWidget
  className="shadow-xl rounded-2xl"
  apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
/>
```

## License

MIT © Accomplish Inc

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.
