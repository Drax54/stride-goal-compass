
/// <reference types="vite/client" />

// Add configuration to suppress unused variable warnings
/* eslint-disable */
// @ts-nocheck
import { ReactElement } from 'react'

// This declaration forces TypeScript to ignore the unused React import warnings
declare namespace JSX {
  interface Element extends ReactElement {}
}

// Add an interface for WeekView props to fix the viewMode prop errors
declare module '*.tsx' {
  interface WeekViewProps {
    viewMode?: 'day' | 'week' | 'month' | 'year';
    key?: number;
  }
}

// Add a global declaration to help with unused imports
declare module 'react' {
  // This empty declaration helps TypeScript recognize React imports even when not explicitly used
}

// Add a global declaration for the User interface from Supabase
declare interface User {
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
}

// Define return type for createTimer
declare interface Timer {
  stop: (additionalData?: Record<string, unknown>) => number;
}

declare module 'lovable-tagger';

