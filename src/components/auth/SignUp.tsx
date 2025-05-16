import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Target, Mail, Lock, ArrowRight } from 'lucide-react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Allow any email format for development
    try {
      console.log(`Attempting to sign up with email: ${email}`);
      
      // Development mode - allow any email format
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Skip email verification for development
          emailRedirectTo: window.location.origin + '/onboarding',
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw error;
      }
      
      console.log('Sign up successful:', data);
      navigate('/onboarding');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during sign up';
      setError(message);
      console.error('Sign up catch block error:', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Decorative */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white items-center justify-center">
        <div className="max-w-md space-y-8 animate-fade-in">
          <Target size={48} className="animate-pulse" />
          <h1 className="text-4xl font-bold">Start Your Journey</h1>
          <p className="text-xl opacity-90">
            Join thousands of people who use our platform to build better habits and achieve their goals.
          </p>
          <div className="space-y-4 text-lg opacity-80">
            <p className="flex items-center space-x-2">
              <ArrowRight size={20} />
              <span>Create personalized habits</span>
            </p>
            <p className="flex items-center space-x-2">
              <ArrowRight size={20} />
              <span>Track your daily progress</span>
            </p>
            <p className="flex items-center space-x-2">
              <ArrowRight size={20} />
              <span>Join a supportive community</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start your journey to better habits today
            </p>
          </div>

          <form className="mt-8 space-y-6 animate-slide-up" onSubmit={handleSignUp}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 animate-shake">
                <div className="flex flex-col space-y-1">
                  <div className="text-sm text-red-700">{error}</div>
                  {error.includes('Please sign in') && (
                    <Link 
                      to="/" 
                      className="text-sm font-medium text-red-700 hover:text-red-800 underline"
                    >
                      Go to sign in
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text" // Changed from email to text to bypass browser validation
                  required
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out"
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
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out"
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
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link 
                to="/" 
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;