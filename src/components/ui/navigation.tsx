import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/programs' },
  { label: 'Training Video', href: '/asac' },
];

const Logo = () => (
  <div className="flex items-center space-x-2">
    <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xl">LB</span>
    </div>
    <span className="font-display text-2xl font-bold gradient-text">LadyBoss</span>
  </div>
);

const NavLinks = ({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) => (
  <>
    {NAV_ITEMS.map((item) => (
      <a
        key={item.label}
        href={item.href}
        className="text-foreground hover:text-primary transition-smooth font-medium"
        onClick={onClose}
      >
        {item.label}
      </a>
    ))}
  </>
);

const AuthButtons = ({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) => {
  const { isAdmin, user, signOut } = useAuth();
  const buttonClass = mobile ? 'w-full' : '';

  return (
    <>
      {user && !isAdmin && (
        <>
          <Link to="/app/home" onClick={onClose}>
            <Button variant="outline" size="sm" className={buttonClass}>
              Open App
            </Button>
          </Link>
          <Link to="/dashboard" onClick={onClose}>
            <Button variant="ghost" size="sm" className={buttonClass}>
              Dashboard
            </Button>
          </Link>
        </>
      )}
      {isAdmin && (
        <Link to="/admin" onClick={onClose}>
          <Button variant="outline" size="sm" className={buttonClass}>
            Admin Dashboard
          </Button>
        </Link>
      )}
      {user ? (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            signOut();
            onClose?.();
          }}
          className={buttonClass}
        >
          Sign Out
        </Button>
      ) : (
        <Link to="/auth" onClick={onClose}>
          <Button variant="ghost" size="sm" className={buttonClass}>
            Sign In
          </Button>
        </Link>
      )}
      {!user && (
        <Button variant="default" className={`bg-primary hover:bg-primary-dark ${buttonClass}`}>
          Join Community
        </Button>
      )}
    </>
  );
};

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />

          <div className="hidden md:flex items-center space-x-8">
            <NavLinks />
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <AuthButtons />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col space-y-4">
              <Link to="/app/home" onClick={() => setIsMenuOpen(false)}>
                <Button variant="default" size="lg" className="w-full bg-primary hover:bg-primary/90">
                  📱 Open App
                </Button>
              </Link>
              <NavLinks mobile onClose={() => setIsMenuOpen(false)} />
              <AuthButtons mobile onClose={() => setIsMenuOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;