import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import riloLogo from '@/assets/rilo-app-icon.png';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6">
        <div className="py-10 grid gap-8 md:grid-cols-2 md:items-start">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src={riloLogo} alt="Rilo" className="w-10 h-10 rounded-xl" />
              <span className="font-display text-2xl font-bold gradient-text">Rilo</span>
            </Link>

            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Programs, live sessions and daily tools to help you grow — on your phone and on the web.
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a className="flex items-center hover:text-primary transition-smooth" href="mailto:support@ladybosslook.com">
                <Mail size={16} className="mr-2" />
                support@ladybosslook.com
              </a>
              <a className="flex items-center hover:text-primary transition-smooth" href="tel:+16265028538">
                <Phone size={16} className="mr-2" />
                +1 (626) 502-8538
              </a>
              <span className="flex items-center">
                <MapPin size={16} className="mr-2" />
                2403 Elements Way, Irvine, CA
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild variant="outline">
              <Link to="/programs">Programs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/chat">Support</Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
              <a href="https://instagram.com/ladybosslook" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </Button>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Ladybosslook LLC. All rights reserved.
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-smooth">
                Privacy Policy
              </Link>
              <Link to="/refund-policy" className="text-muted-foreground hover:text-primary transition-smooth">
                Refund Policy
              </Link>
              <Link to="/delete-account" className="text-muted-foreground hover:text-primary transition-smooth">
                Delete Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
