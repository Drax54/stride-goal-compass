
/**
 * Application-wide logging utility
 * Provides consistent logging across the application with categorization
 */

// Define log categories
export enum LogCategory {
  AUTH = 'Authentication',
  DB = 'Database',
  HABITS = 'Habits',
  UI = 'User Interface',
  API = 'API',
  NAVIGATION = 'Navigation',
  SYSTEM = 'System',
  PERFORMANCE = 'Performance',
  ERROR = 'Error'
}

// Define log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Current log level - can be adjusted based on environment
const CURRENT_LOG_LEVEL = 
  process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

// Type for log data
export type LogData = Record<string, unknown>;

/**
 * Format log data as a string
 */
const formatLogData = (data?: Record<string, unknown>): string => {
  if (!data) return '';
  try {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  } catch {
    return '[Error formatting log data]';
  }
}

/**
 * Log an event
 */
export const logEvent = (
  category: LogCategory, 
  message: string, 
  data?: Record<string, unknown>
) => {
  if (CURRENT_LOG_LEVEL <= LogLevel.INFO) {
    const timestamp = new Date().toISOString();
    const dataString = formatLogData(data);
    console.info(
      `[${timestamp}] [${category}] ${message}${dataString ? ` | ${dataString}` : ''}`
    );
  }
}

/**
 * Log a warning
 */
export const logWarning = (
  category: LogCategory, 
  message: string, 
  data?: Record<string, unknown>
) => {
  if (CURRENT_LOG_LEVEL <= LogLevel.WARN) {
    const timestamp = new Date().toISOString();
    const dataString = formatLogData(data);
    console.warn(
      `[${timestamp}] [${category}] WARNING: ${message}${dataString ? ` | ${dataString}` : ''}`
    );
  }
}

/**
 * Log an error
 */
export const logError = (
  category: LogCategory, 
  message: string, 
  data?: Record<string, unknown>
) => {
  if (CURRENT_LOG_LEVEL <= LogLevel.ERROR) {
    const timestamp = new Date().toISOString();
    const dataString = formatLogData(data);
    console.error(
      `[${timestamp}] [${category}] ERROR: ${message}${dataString ? ` | ${dataString}` : ''}`
    );
  }
}

/**
 * Log debug information
 */
export const logDebug = (
  category: LogCategory, 
  message: string, 
  data?: Record<string, unknown>
) => {
  if (CURRENT_LOG_LEVEL <= LogLevel.DEBUG) {
    const timestamp = new Date().toISOString();
    const dataString = formatLogData(data);
    console.debug(
      `[${timestamp}] [${category}] DEBUG: ${message}${dataString ? ` | ${dataString}` : ''}`
    );
  }
}

/**
 * Create a performance timer
 */
export const createTimer = (category: LogCategory, operation: string) => {
  const startTime = performance.now();
  
  return {
    stop: (additionalData?: Record<string, unknown>) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logEvent(category, `${operation} completed`, {
        durationMs: duration.toFixed(2),
        ...additionalData
      });
      
      return duration;
    }
  };
} 
