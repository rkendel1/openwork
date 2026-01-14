'use client';

import { OpenworkWidget } from '@/components/OpenworkWidget';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
            Openwork
          </h1>
          <p className="text-xl text-muted-foreground">
            The open source AI coworker that works for you
          </p>
        </div>

        <OpenworkWidget
          onTaskStart={(task) => console.log('Task started:', task)}
          onTaskComplete={(task) => console.log('Task completed:', task)}
          onError={(error) => console.error('Task error:', error)}
        />

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Web version of Openwork • Ready to embed in any Next.js application
          </p>
          <p className="text-xs text-muted-foreground">
            Check the <code className="bg-muted px-2 py-1 rounded">README.md</code> for embedding instructions
          </p>
        </div>
      </div>
    </div>
  );
}
