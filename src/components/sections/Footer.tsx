import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const footerLinks = {
    Programs: [
      'Money Literacy Course',
      'Business Growth Accelerator',
      'Elite Networking Mastermind',
      'Free Resources'
    ],
    Company: [
      'About Us',
      'Success Stories',
      'Community Guidelines',
      'Careers'
    ],
    Support: [
      'Help Center',
      'Contact Support',
      'Book Consultation',
      'Privacy Policy'
    ],
    Resources: [
      'Blog & Articles',
      'Podcast',
      'Free Webinars',
      'Download Guides'
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-6 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">LB</span>
                </div>
                <span className="font-display text-2xl font-bold gradient-text">
                  LadyBoss Academy
                </span>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Empowering ambitious women to build successful businesses, achieve financial 
                independence, and create the life they've always dreamed of.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail size={16} className="mr-2" />
                  support@ladybosslook.com
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone size={16} className="mr-2" />
                  +1 (626) 502-8538
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin size={16} className="mr-2" />
                  2403 Elements way, Irvine, CA
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 hover:text-primary"
                    asChild
                  >
                    <a href={social.href} aria-label={social.label}>
                      <social.icon size={20} />
                    </a>
                  </Button>
                ))}
              </div>
            </div>

            {/* Links Sections */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-4">
                <h3 className="font-semibold text-foreground">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link, index) => (
                    <li key={index}>
                      {link === 'Privacy Policy' ? (
                        <Link
                          to="/privacy"
                          className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                        >
                          {link}
                        </Link>
                      ) : (
                        <a
                          href="#"
                          className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                        >
                          {link}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="font-display text-xl font-semibold mb-2">
                Stay Connected with the LadyBoss Community
              </h3>
              <p className="text-muted-foreground">
                Get weekly tips, exclusive content, and success stories delivered to your inbox.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="px-4 py-2 border border-input rounded-lg bg-background min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="bg-primary hover:bg-primary-dark">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              © 2024 LadyBoss Academy. All rights reserved. Empowering women worldwide.
            </div>
            
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-smooth">
                Privacy Policy
              </Link>
              <Link to="/refund-policy" className="text-muted-foreground hover:text-primary transition-smooth">
                Refund Policy
              </Link>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                Terms of Service
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;