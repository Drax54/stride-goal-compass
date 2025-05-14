import { Link } from 'react-router-dom';
import { Calendar, Target, Facebook, Twitter, Instagram, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted py-12">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-accent mb-4">
              <Target className="h-6 w-6" />
              <span>Habitify</span>
            </Link>
            <p className="text-muted-foreground mb-4">
              Track your habits, build consistency, and achieve your goals with Habitify.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-muted-foreground hover:text-accent transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-accent transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-accent transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/changelog" className="text-muted-foreground hover:text-accent transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-accent transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-muted-foreground hover:text-accent transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-muted-foreground hover:text-accent transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-6 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Habitify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
