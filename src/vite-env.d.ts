
/// <reference types="vite/client" />

// Add global User interface for Supabase
interface User {
  id: string;
  aud: string;
  role: string | undefined;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: any;
  identities: any[];
  created_at: string;
  updated_at: string;
}

// Define LogCategory enum for proper usage in logger calls
declare namespace LogCategory {
  export const SYSTEM: string;
  export const AUTH: string;
  export const HABITS: string;
  export const DB: string;
  export const PERFORMANCE: string;
  export const ERROR: string;
  export const UI: string;
  export const API: string;
  export const NAVIGATION: string;
}

// Define return type for createTimer
declare interface Timer {
  stop: (additionalData?: Record<string, unknown>) => number;
}

// Types for Lovable tagger
declare module 'lovable-tagger';

// Types for WeekView props
interface WeekViewProps {
  viewMode?: 'day' | 'week' | 'month' | 'year';
  key?: number;
}
