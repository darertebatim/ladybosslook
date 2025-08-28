import Navigation from '@/components/ui/navigation';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Programs from '@/components/sections/Programs';
import Testimonials from '@/components/sections/Testimonials';
import CTA from '@/components/sections/CTA';
import Footer from '@/components/sections/Footer';
import { AutoSendTestEmail } from '@/components/TestEmailSender';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AutoSendTestEmail />
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
