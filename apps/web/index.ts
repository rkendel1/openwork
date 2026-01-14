/**
 * @accomplish/web - Web version of Openwork
 * 
 * This package provides embeddable React components for integrating
 * Openwork functionality into Next.js applications.
 */

export { OpenworkWidget } from './components/OpenworkWidget';
export type { OpenworkWidgetProps } from './components/OpenworkWidget';

export { getOpenworkAPI, isRunningInElectron, getShellVersion, getShellPlatform } from './lib/openwork-api';

// Re-export shared types
export type {
  Task,
  TaskConfig,
  TaskStatus,
  TaskUpdateEvent,
  PermissionRequest,
  PermissionResponse,
  TaskProgress,
  ApiKeyConfig,
  TaskMessage,
} from '@accomplish/shared';
