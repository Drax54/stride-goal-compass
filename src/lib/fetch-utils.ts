/**
 * Utility functions for handling fetch operations and network issues
 */

// Supabase credentials for reference in connectivity checks
const SUPABASE_URL = 'https://ydsrnoiilkvftlqzhzji.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc3Jub2lpbGt2ZnRscXpoemppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MzQ4MDAsImV4cCI6MjA1OTUxMDgwMH0.2xth7LXLnes9Wh7hxqX_OlweIkJoSqPJdBODEQvjks0';

/**
 * Check if the internet connection is available by trying multiple endpoints
 * @returns Promise resolving to boolean indicating if network is available
 */
export async function checkNetworkConnection(): Promise<boolean> {
  // List of URLs to try (in order) for connectivity check
  const urlsToTry = [
    'https://www.google.com/favicon.ico',
    'https://www.cloudflare.com/favicon.ico', 
    'https://www.microsoft.com/favicon.ico',
    'https://www.apple.com/favicon.ico'
  ];
  
  // Try each URL in sequence
  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`Network check successful via ${url}`);
      return true;
    } catch (error) {
      console.log(`Network check failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
      // Continue to next URL
    }
  }
  
  console.error('All network connectivity checks failed');
  return false;
}

/**
 * Check if the Supabase service is reachable with multiple attempts
 * @param supabaseUrl The URL of the Supabase service
 * @returns Promise resolving to boolean indicating if Supabase is reachable
 */
export async function checkSupabaseReachable(supabaseUrl: string = SUPABASE_URL): Promise<boolean> {
  // Endpoints to try for Supabase connectivity
  const endpoints = [
    '/auth/v1/',
    '/rest/v1/',
    '/storage/v1/'
  ];
  
  // Try each endpoint
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY
        },
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 404 || response.status === 400) {
        // 404/400 are fine - endpoint exists but not found / bad request
        console.log(`Supabase check successful via ${endpoint}`);
        return true;
      }
    } catch (error) {
      console.log(`Supabase check failed for ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      // Continue to next endpoint
    }
  }
  
  console.error('All Supabase connectivity checks failed');
  return false;
}

/**
 * Returns a descriptive error message for various connection scenarios
 */
export function getConnectionErrorMessage(
  hasNetwork: boolean, 
  isSupabaseReachable: boolean
): string {
  if (!hasNetwork) {
    return "Your device appears to be offline. Please check your internet connection and try again.";
  } else if (!isSupabaseReachable) {
    return "We can't reach our database service right now. This could be due to temporary maintenance or service issues.";
  } else {
    return "There was a problem connecting to our database. This might be a temporary issue - please try again.";
  }
} 