import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AppIconGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);

  const generateIcon = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-app-icon');
      
      if (error) {
        throw error;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (data?.imageUrl) {
        setGeneratedIcon(data.imageUrl);
        toast.success('Icon generated successfully!');
      } else {
        throw new Error('No image returned');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate icon');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadIcon = () => {
    if (!generatedIcon) return;
    
    const link = document.createElement('a');
    link.href = generatedIcon;
    link.download = 'app-icon-1024.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Icon downloaded! Add it to Xcode Assets.xcassets');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">App Icon Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate a premium Liquid Glass style app icon for LadyBoss
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Generator Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Icon Generator
              </CardTitle>
              <CardDescription>
                Creates a glassmorphism crown icon with purple/magenta gradient and golden accents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateIcon} 
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : generatedIcon ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Icon
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Icon
                  </>
                )}
              </Button>

              {generatedIcon && (
                <Button 
                  onClick={downloadIcon}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download 1024x1024
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Icon Preview</CardTitle>
              <CardDescription>
                How your icon will appear at different sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedIcon ? (
                <div className="space-y-6">
                  {/* Main preview */}
                  <div className="flex justify-center">
                    <img 
                      src={generatedIcon} 
                      alt="Generated App Icon" 
                      className="w-48 h-48 rounded-[2.5rem] shadow-2xl"
                    />
                  </div>
                  
                  {/* Size previews */}
                  <div className="flex items-end justify-center gap-4">
                    <div className="text-center">
                      <img 
                        src={generatedIcon} 
                        alt="180px" 
                        className="w-[60px] h-[60px] rounded-xl shadow-lg mx-auto"
                      />
                      <span className="text-xs text-muted-foreground mt-1 block">60px</span>
                    </div>
                    <div className="text-center">
                      <img 
                        src={generatedIcon} 
                        alt="120px" 
                        className="w-[80px] h-[80px] rounded-2xl shadow-lg mx-auto"
                      />
                      <span className="text-xs text-muted-foreground mt-1 block">80px</span>
                    </div>
                    <div className="text-center">
                      <img 
                        src={generatedIcon} 
                        alt="180px" 
                        className="w-[120px] h-[120px] rounded-3xl shadow-lg mx-auto"
                      />
                      <span className="text-xs text-muted-foreground mt-1 block">120px</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-2xl">
                  <p className="text-muted-foreground text-center">
                    Click "Generate Icon" to create<br />your new app icon
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        {generatedIcon && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. <strong>Download</strong> the 1024x1024 icon above</p>
              <p>2. Open <strong>Xcode → ios/App/App/Assets.xcassets</strong></p>
              <p>3. Click <strong>AppIcon</strong> in the asset catalog</p>
              <p>4. Drag your downloaded icon to the <strong>1024pt</strong> slot (or "All Sizes" for automatic generation)</p>
              <p>5. Xcode will generate all required sizes automatically</p>
              <p>6. <strong>Build and run</strong> to see your new icon!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
