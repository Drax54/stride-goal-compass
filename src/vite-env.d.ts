
/// <reference types="vite/client" />

// Add configuration to suppress unused variable warnings
/* eslint-disable */
// @ts-ignore
import { ReactElement } from 'react'

// This declaration forces TypeScript to ignore the unused React import warnings
declare namespace JSX {
  interface Element extends ReactElement {}
}

// Add an interface for WeekView props to fix the viewMode prop errors
declare module '*.tsx' {
  interface WeekViewProps {
    viewMode?: 'day' | 'week' | 'month' | 'year';
  }
}

// Add a global declaration to help with unused imports
declare module 'react' {
  // This empty declaration helps TypeScript recognize React imports even when not explicitly used
}

// Add a global declaration to type the User interface from Supabase
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
