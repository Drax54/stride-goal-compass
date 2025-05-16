import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles, Brain, Calendar, CheckCircle, Cog, Bug } from 'lucide-react';

/**
 * LoadingScreen component shows while habits are being generated
 * This stays visible until the API call completes
 */
const LoadingScreen = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showDebug, setShowDebug] = useState(true);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  const messages = [
    "Creating your personalized habit plan...",
    "Designing habits that align with your goals...",
    "Building your success blueprint...",
    "Structuring your journey to consistency...",
    "Preparing your path to excellence..."
  ];

  const tips = [
    "Small actions, repeated daily, create extraordinary results.",
    "Your habits shape your future self.",
    "Progress is built one day at a time.",
    "Consistency matters more than intensity.",
    "Every day is a new opportunity to build better habits."
  ];
  
  // Capture console logs for debugging
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = function(...args) {
      setLogMessages(prev => [...prev, args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')].slice(-20));
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function(...args) {
      setLogMessages(prev => [...prev, `ERROR: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`].slice(-20));
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);
  
  // Track elapsed time (for debugging and user feedback)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    // Simulate loading progress
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        // Use elapsed time to modify progress bar behavior
        if (elapsedTime < 3) {
          // Fast progress at first (0-40%)
          if (prev < 40) {
            return prev + Math.random() * 8;
          }
        } else if (elapsedTime < 8) {
          // Slower in the middle (40-70%)
          if (prev < 70) {
            return prev + Math.random() * 4;
          }
        } else {
          // Very slow at the end (70-95%)
          if (prev < 95) {
            return prev + Math.random() * 1;
          }
        }
        return prev;
      });
    }, 800);
    
    // Rotate messages every 2.5 seconds
    const messageTimer = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 2500);
    
    // Rotate tips every 4 seconds
    const tipTimer = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 4000);
    
    return () => {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
      clearInterval(tipTimer);
    };
  }, [elapsedTime, messages.length]);
  
  // After 20 seconds, show a message that it's taking longer than usual
  const showLongWaitMessage = elapsedTime > 20;
  
  const icons = [
    <Target key="target" className="w-10 h-10 text-blue-400" />,
    <Sparkles key="sparkles" className="w-10 h-10 text-yellow-400" />,
    <Brain key="brain" className="w-10 h-10 text-purple-400" />,
    <Calendar key="calendar" className="w-10 h-10 text-green-400" />,
    <CheckCircle key="check" className="w-10 h-10 text-teal-400" />
  ];
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-900 z-50">
      <div className="text-center text-white p-8 max-w-2xl">
        {/* Debug toggle button */}
        <button 
          onClick={() => setShowDebug(prev => !prev)}
          className="absolute top-4 right-4 z-50 bg-yellow-500 hover:bg-yellow-400 px-3 py-2 rounded-md font-medium text-black flex items-center"
        >
          {showDebug ? (
            <>
              <Bug className="w-5 h-5 mr-2" /> Hide Debug
            </>
          ) : (
            <>
              <Cog className="w-5 h-5 mr-2" /> Show Debug
            </>
          )}
        </button>

        {/* Top animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 1, type: "spring" }}
          className="mb-8 mx-auto w-32 h-32 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-blue-300 border-t-transparent animate-spin"></div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {icons[currentMessage % icons.length]}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Main message */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentMessage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6"
          >
            {messages[currentMessage]}
          </motion.h1>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full h-2 bg-blue-900 rounded-full mb-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Progress indicator text */}
        <div className="text-blue-200 text-sm mb-8">
          {progress < 40 ? "Setting up..." : 
           progress < 70 ? "Generating habits..." : 
           "Finalizing your plan..."}
          {elapsedTime > 0 && <span className="ml-2 text-xs opacity-70">({elapsedTime}s)</span>}
        </div>

        {/* Debug log display */}
        {showDebug && (
          <div className="mt-4 mb-4 bg-gray-900 bg-opacity-50 p-4 rounded-lg text-left text-xs h-48 overflow-y-auto">
            <div className="font-mono text-green-400">
              {logMessages.length > 0 ? (
                logMessages.map((log, i) => (
                  <div key={i} className={log.startsWith('ERROR:') ? 'text-red-400' : ''}>
                    {log}
                  </div>
                ))
              ) : (
                <div>Waiting for log messages...</div>
              )}
            </div>
          </div>
        )}

        {/* Tips - only show if debug panel is hidden */}
        {!showDebug && (
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTip}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-xl text-blue-100 italic mb-8"
            >
              "{tips[currentTip]}"
            </motion.p>
          </AnimatePresence>
        )}
        
        {/* Long wait message */}
        {showLongWaitMessage && !showDebug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-yellow-200 text-sm mt-8 p-4 border border-yellow-300 rounded-lg"
          >
            <p>This is taking longer than usual. Our AI is carefully crafting personalized habits for you.</p>
            <p className="mt-2">Please be patient as we make sure your habits are just right!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen; 