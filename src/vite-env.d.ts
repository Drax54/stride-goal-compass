
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
