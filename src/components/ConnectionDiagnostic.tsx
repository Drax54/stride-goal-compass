import React, { useState, useEffect } from 'react';
import { checkSupabaseHealth, testSupabaseQuery, checkProjectExists } from '../lib/supabase-checker';

interface DiagnosticResult {
  test: string;
  result: boolean;
  message: string;
  error?: string;
}

const ConnectionDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showRawResults, setShowRawResults] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Test 1: Check if project exists
    try {
      const projectResult = await checkProjectExists();
      setResults(prev => [...prev, {
        test: 'Project existence check',
        result: projectResult.exists,
        message: projectResult.message
      }]);
      
      // Only continue if project exists
      if (projectResult.exists) {
        // Test 2: Basic health check
        try {
          const healthResult = await checkSupabaseHealth();
          setResults(prev => [...prev, {
            test: 'Supabase health check',
            result: healthResult.ok,
            message: healthResult.message
          }]);
          
          // Test 3: Query test
          try {
            const queryResult = await testSupabaseQuery();
            setResults(prev => [...prev, {
              test: 'Supabase query test',
              result: queryResult.ok,
              message: queryResult.message,
              error: queryResult.error ? JSON.stringify(queryResult.error) : undefined
            }]);
          } catch (queryError) {
            setResults(prev => [...prev, {
              test: 'Supabase query test',
              result: false,
              message: `Error running query test: ${queryError instanceof Error ? queryError.message : String(queryError)}`
            }]);
          }
        } catch (healthError) {
          setResults(prev => [...prev, {
            test: 'Supabase health check',
            result: false,
            message: `Error running health check: ${healthError instanceof Error ? healthError.message : String(healthError)}`
          }]);
        }
      }
    } catch (projectError) {
      setResults(prev => [...prev, {
        test: 'Project existence check',
        result: false,
        message: `Error checking project: ${projectError instanceof Error ? projectError.message : String(projectError)}`
      }]);
    }
    
    setIsRunning(false);
  };

  // Run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Supabase Connection Diagnostic</h2>
        
        <div className="mb-4">
          <p className="text-gray-600">
            This tool checks your Supabase connection in multiple ways to help identify the source of any issues.
          </p>
        </div>
        
        <div className="mb-6">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className={`w-full py-2 px-4 rounded-lg ${
              isRunning 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isRunning ? 'Running tests...' : 'Run diagnostics again'}
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-medium border-b border-gray-200">
              Test Results
            </div>
            <ul className="divide-y divide-gray-200">
              {results.map((result, index) => (
                <li key={index} className="p-4">
                  <div className="flex items-center mb-1">
                    <div className={`w-4 h-4 rounded-full mr-2 ${
                      result.result ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <p className={`text-sm ${result.result ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </p>
                  {result.error && showRawResults && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      <pre>{result.error}</pre>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-4 flex justify-between">
          <label className="flex items-center text-sm text-gray-600">
            <input 
              type="checkbox"
              checked={showRawResults}
              onChange={() => setShowRawResults(!showRawResults)}
              className="mr-2"
            />
            Show technical details
          </label>
          
          <span className="text-xs text-gray-500">
            Using: ydsrnoiilkvftlqzhzji.supabase.co
          </span>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-2">Common Issues</h3>
        
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
          <li>
            <strong>Project doesn't exist</strong>: Check that your Supabase project is active and that you're 
            using the correct URL.
          </li>
          <li>
            <strong>CORS errors</strong>: Your Supabase project may need CORS configuration. Add your 
            application domain to the allowed origins in the Supabase dashboard.
          </li>
          <li>
            <strong>API key issues</strong>: Make sure you're using a valid API key with the appropriate 
            permissions.
          </li>
          <li>
            <strong>Network issues</strong>: Check if your network has any firewalls or proxy settings that 
            might be blocking connections to Supabase.
          </li>
        </ul>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionDiagnostic; 