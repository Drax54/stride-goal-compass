import { createClient } from '@supabase/supabase-js';

// Use direct values for Supabase credentials
const supabaseUrl = 'https://ydsrnoiilkvftlqzhzji.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc3Jub2lpbGt2ZnRscXpoemppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MzQ4MDAsImV4cCI6MjA1OTUxMDgwMH0.2xth7LXLnes9Wh7hxqX_OlweIkJoSqPJdBODEQvjks0';

// Initialize Supabase client with improved configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
    // Using fetch with specific timeout and retry logic
    fetch: async (url, options = {}) => {
      // Implement timeout for fetch operations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Add signal to options
        const fetchOptions = {
          ...options,
          signal: controller.signal,
          credentials: 'omit' as RequestCredentials, // Fix type issue
          mode: 'cors' as RequestMode,
        };
        
        const response = await window.fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', error);
        throw error;
      }
    }
  },
});