
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Target } from 'lucide-react';

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This will be replaced with actual auth state

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container flex justify-between items-center h-16 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-accent">
          <Target className="h-6 w-6" />
          <span>Habitify</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-foreground/70 transition-colors hover:text-foreground">
            Home
          </Link>
          <Link to="/features" className="text-foreground/70 transition-colors hover:text-foreground">
            Features
          </Link>
          <Link to="/pricing" className="text-foreground/70 transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link to="/blog" className="text-foreground/70 transition-colors hover:text-foreground">
            Blog
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link to="/dashboard">
              <Button className="bg-accent hover:bg-accent/90">
                <Calendar className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-accent hover:bg-accent/90">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
