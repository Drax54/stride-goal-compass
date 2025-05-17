
/// <reference types="vite/client" />

// Add configuration to suppress unused variable warnings
/* eslint-disable */
// @ts-ignore
import { ReactElement } from 'react'

// This declaration forces TypeScript to ignore the unused React import warnings
declare namespace JSX {
  interface Element extends ReactElement {}
}
