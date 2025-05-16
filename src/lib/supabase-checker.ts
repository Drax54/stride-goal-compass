/**
 * Utility to manually test Supabase connectivity using direct fetch calls
 */

// Supabase project credentials
const supabaseUrl = 'https://ydsrnoiilkvftlqzhzji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc3Jub2lpbGt2ZnRscXpoemppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MzQ4MDAsImV4cCI6MjA1OTUxMDgwMH0.2xth7LXLnes9Wh7hxqX_OlweIkJoSqPJdBODEQvjks0';

/**
 * Check Supabase connection health using direct fetch
 */
export async function checkSupabaseHealth(): Promise<{ ok: boolean; message: string }> {
  try {
    // First check Supabase health endpoint
    console.log('Checking Supabase health using direct fetch...');
    
    // Testing the REST API endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('Supabase health response status:', response.status);
    
    // Check response
    if (response.ok || response.status === 404) {
      return { ok: true, message: 'Supabase is reachable' };
    } else {
      const text = await response.text();
      return { 
        ok: false, 
        message: `Supabase returned status ${response.status}: ${text.substring(0, 100)}` 
      };
    }
  } catch (error) {
    console.error('Supabase health check error:', error);
    return { 
      ok: false, 
      message: `Error checking Supabase: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Test retrieving data from Supabase
 */
export async function testSupabaseQuery(): Promise<{ ok: boolean; message: string; error?: unknown }> {
  try {
    // Attempt a direct REST API query
    console.log('Attempting direct Supabase REST query...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/habits?select=count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'count=exact'
      }
    });
    
    console.log('Supabase query response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      return { 
        ok: false, 
        message: `Supabase query failed with status ${response.status}: ${text.substring(0, 100)}` 
      };
    }
    
    const data = await response.json();
    return { 
      ok: true, 
      message: `Successfully queried Supabase: ${JSON.stringify(data).substring(0, 100)}` 
    };
  } catch (error) {
    console.error('Supabase query error:', error);
    return { 
      ok: false, 
      message: `Error querying Supabase: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
}

/**
 * Test if the Supabase project exists
 */
export async function checkProjectExists(): Promise<{ exists: boolean; message: string }> {
  const pingEndpoints = [
    '/auth/v1/health',
    '/rest/v1/',
    '/storage/v1/health'
  ];
  
  for (const endpoint of pingEndpoints) {
    try {
      const response = await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // If we get any response (even an error), the project exists
      if (response.status !== 0) {
        return { 
          exists: true, 
          message: `Project exists: got status ${response.status} from ${endpoint}` 
        };
      }
    } catch (error) {
      console.log(`Project check failed for ${endpoint}: ${error}`);
      // Continue to next endpoint
    }
  }
  
  // If all endpoints failed to respond
  return { 
    exists: false, 
    message: 'Supabase project appears to be unreachable or does not exist' 
  };
} 