import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Gift, Users } from "lucide-react";

const Giveaway = () => {
  const pdfUrl = "https://mnukhzjcvbwpvktxqlej.supabase.co/storage/v1/object/public/documents/RightsnboundariesLadybossgift.pdf";

  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <>
      <SEOHead
        title="Free Gift - Rights & Boundaries Guide | Lady Boss Business"
        description="Download your exclusive free guide on Rights & Boundaries for business women who watched our training video."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-luxury-dark via-luxury-navy to-luxury-deep text-luxury-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Gift className="w-12 h-12 text-luxury-gold" />
                <Users className="w-8 h-8 text-luxury-silver" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-luxury-gold to-luxury-silver bg-clip-text text-transparent">
                Your Free Gift
              </h1>
              
              <p className="text-xl text-luxury-silver leading-relaxed">
                Thank you for watching our training video! Here's your exclusive guide on Rights & Boundaries.
              </p>
            </div>

            {/* Gift Card */}
            <Card className="bg-luxury-navy/40 border-luxury-gold/20 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-center gap-3 text-luxury-gold text-2xl">
                  <Download className="w-6 h-6" />
                  Rights & Boundaries Guide
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <p className="text-luxury-silver text-center leading-relaxed">
                  A comprehensive guide specifically designed for business women who want to establish clear boundaries and understand their rights in the professional world.
                </p>
                
                <div className="space-y-4">
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-luxury-gold to-luxury-gold/80 hover:from-luxury-gold/90 hover:to-luxury-gold text-luxury-dark font-semibold py-6 text-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Your Free Guide
                  </Button>
                  
                  <p className="text-sm text-luxury-silver/70 text-center">
                    PDF format • Instant download • No signup required
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Message */}
            <div className="bg-luxury-deep/30 border border-luxury-silver/20 rounded-xl p-6">
              <p className="text-luxury-silver text-center">
                💡 <strong>Pro Tip:</strong> Save this guide to your device and refer back to it whenever you need to reinforce your professional boundaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Giveaway;