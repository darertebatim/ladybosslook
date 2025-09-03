import Navigation from '@/components/ui/navigation';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Programs from '@/components/sections/Programs';
import Testimonials from '@/components/sections/Testimonials';
import CTA from '@/components/sections/CTA';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead />
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Programs />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
