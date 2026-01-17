import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AppSupport = () => {
  const { user } = useAuth();
  return (
    <>
      <SEOHead 
        title="App Support - Ladybosslook Academy"
        description="Get help and support for the Ladybosslook Academy mobile app. Contact our support team for assistance."
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              App Support
            </h1>
            <p className="text-xl text-muted-foreground mb-12">
              We're here to help you get the most out of Ladybosslook Academy
            </p>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>
                    Reach out to our support team for any questions or issues
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Mail className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Email Support</p>
                      <a 
                        href="mailto:support@ladybosslook.com" 
                        className="text-primary hover:underline"
                      >
                        support@ladybosslook.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MessageCircle className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Telegram Support</p>
                      <a 
                        href="https://t.me/ladybosslook" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @ladybosslook
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Response Time</p>
                      <p className="text-muted-foreground">
                        We typically respond within 24 hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">How do I access my courses?</h3>
                    <p className="text-muted-foreground">
                      Once enrolled, all your courses will appear in the app's home screen. Tap on any course to start learning.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Can I download audio content for offline listening?</h3>
                    <p className="text-muted-foreground">
                      Yes! Use the audio player to stream content. Downloads for offline access are available within each course.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">How do I reset my password?</h3>
                    <p className="text-muted-foreground">
                      Use the "Forgot Password" link on the login screen, or contact support for assistance.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">What devices are supported?</h3>
                    <p className="text-muted-foreground">
                      The app is available for iOS devices running iOS 13.0 or later.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you're experiencing technical difficulties, please include the following information when contacting support:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Your device model and iOS version</li>
                    <li>App version number</li>
                    <li>Description of the issue</li>
                    <li>Steps to reproduce the problem</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="text-center pt-8 space-y-3">
                {user && (
                  <Button asChild size="lg" className="w-full max-w-xs">
                    <Link to="/app/chat">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Chat with Support
                    </Link>
                  </Button>
                )}
                <Button asChild size="lg" variant={user ? "outline" : "default"} className="w-full max-w-xs">
                  <a href="mailto:support@ladybosslook.com">
                    <Mail className="mr-2 h-5 w-5" />
                    Email Support
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppSupport;
