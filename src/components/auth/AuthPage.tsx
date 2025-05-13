
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Target } from 'lucide-react';

export function AuthPage() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/auth/login';

  return (
    <Layout hideFooter>
      <div className="container py-10">
        <div className="flex min-h-[80vh] w-full flex-col items-center justify-center md:grid md:grid-cols-2 lg:grid-cols-3">
          <div className="hidden md:col-span-1 md:flex md:flex-col md:items-center md:justify-center lg:col-span-2">
            <div className="relative mx-auto w-full max-w-md overflow-hidden">
              <div className="pb-8">
                <div className="flex items-center justify-center space-x-2">
                  <Target className="h-12 w-12 text-accent" />
                  <h1 className="text-4xl font-bold text-accent">Habitify</h1>
                </div>
                <p className="mt-6 text-center text-lg text-gray-600">
                  Track your habits, build consistency, and achieve your goals with Habitify
                </p>
              </div>
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-accent to-purple-400 p-4">
                <div className="h-full w-full rounded-lg bg-white/90 p-6 shadow-xl">
                  <div className="space-y-4">
                    <div className="h-2 w-20 rounded bg-accent/20"></div>
                    <div className="h-12 w-full rounded bg-accent/10"></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-20 rounded bg-accent/10"></div>
                      <div className="h-20 rounded bg-accent/10"></div>
                      <div className="h-20 rounded bg-accent/10"></div>
                    </div>
                    <div className="h-12 w-full rounded bg-accent/10"></div>
                    <div className="h-32 w-full rounded bg-accent/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full max-w-md px-6 md:col-span-1 md:px-0">
            {isLoginPage ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AuthPage;
