import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Target, Mail, Lock } from 'lucide-react';
import { logEvent, LogCategory } from '../../lib/logger';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    logEvent(LogCategory.AUTH, 'Sign in attempt', { email: email.split('@')[0] });
    
    try {
      console.log(`🔐 Attempting sign in for user: ${email}`);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(`🔐 Sign in failed: ${error.message}`, error);
        logEvent(LogCategory.AUTH, 'Sign in failed', { error: error.message });
        throw error;
      }

      console.log(`🔐 Sign in successful for user: ${email}`);
      logEvent(LogCategory.AUTH, 'Sign in successful', { userId: data?.user?.id });

      // After successful sign in, check if user has any goals
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log(`🔐 Retrieved user data: ${user.id}`);
        const { data: goals, error: goalsError } = await supabase
          .from('user_goals')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (goalsError) {
          console.error(`🔐 Error fetching goals: ${goalsError.message}`, goalsError);
        }

        console.log(`🔐 User has goals: ${goals && goals.length > 0}`);
        logEvent(LogCategory.AUTH, 'Checked user goals', { 
          hasGoals: goals && goals.length > 0,
          userId: user.id
        });

        // If no goals exist, redirect to onboarding
        if (!goals?.length) {
          console.log(`🔐 Redirecting to onboarding: new user`);
          logEvent(LogCategory.AUTH, 'Redirect to onboarding', { userId: user.id });
          navigate('/onboarding');
        } else {
          console.log(`🔐 Redirecting to dashboard: existing user`);
          logEvent(LogCategory.AUTH, 'Redirect to dashboard', { userId: user.id });
          navigate('/dashboard');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Decorative */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white items-center justify-center">
        <div className="max-w-md space-y-8 animate-fade-in">
          <Target size={48} className="animate-pulse" />
          <h1 className="text-4xl font-bold">Track Your Progress</h1>
          <p className="text-xl opacity-90">
            Build better habits, achieve your goals, and become the best version of yourself.
          </p>
          <div className="space-y-4 text-lg opacity-80">
            <p>✓ Set and track daily habits</p>
            <p>✓ Monitor your progress</p>
            <p>✓ Achieve your goals</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to continue your journey
            </p>
          </div>

          <form className="mt-8 space-y-6 animate-slide-up" onSubmit={handleSignIn}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 animate-shake">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link 
                to="/signup" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;