import { SEOHead } from "@/components/SEOHead";

const SMSTerms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Terms of Use – Ladybosslook" description="Terms of Use, subscription terms, and messaging terms for the Ladybosslook app." />

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Use</h1>
          <p className="text-foreground/60 text-sm">Last updated: February 2026</p>
          <div className="bg-muted p-6 rounded-lg mt-4">
            <p className="text-foreground font-medium mb-2">Ali Lotfi</p>
            <p className="text-foreground/80 mb-1">2403 Elements Way # 2403</p>
            <p className="text-foreground/80 mb-1">Irvine CA US 92612-1536</p>
            <p className="text-foreground/80 mb-1">
              <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a>
            </p>
            <p className="text-foreground/80">(415) 542-8062</p>
          </div>
        </header>

        <main className="prose prose-lg max-w-none">
          {/* ── 1. General Terms ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground/80 mb-4">
              By downloading, installing, or using the Ladybosslook mobile application ("App"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree, do not use the App.
            </p>
            <p className="text-foreground/80 mb-4">
              We reserve the right to update these Terms at any time. Continued use of the App after changes are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* ── 2. Description of Service ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-foreground/80 mb-4">
              Ladybosslook is a wellness and personal-growth app that provides guided audio programs, daily planner tools, breathing exercises, emotion tracking, reflections, and related features. Certain features require a paid subscription ("Ladybosslook+").
            </p>
          </section>

          {/* ── 3. Subscription Terms ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Ladybosslook+ Subscription</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">3.1 Plans & Pricing</h3>
            <p className="text-foreground/80 mb-4">
              Ladybosslook+ is offered as an auto-renewable subscription. Current plans include a monthly option and an annual option. Prices are displayed in your local currency on the subscription screen within the App and on the App Store product page before you confirm your purchase.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">3.2 Free Trial</h3>
            <p className="text-foreground/80 mb-4">
              Eligible new subscribers may receive a free trial period (e.g., 7 days). During the free trial you have full access to all Ladybosslook+ features. <strong>Your subscription will automatically renew and your payment method will be charged at the end of the free trial period unless you cancel at least 24 hours before the trial ends.</strong> You can cancel at any time in your Apple ID account settings.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">3.3 Auto-Renewal</h3>
            <p className="text-foreground/80 mb-4">
              Your subscription automatically renews at the end of each billing period (monthly or annually) unless you turn off auto-renewal at least 24 hours before the current period ends. Your Apple ID account will be charged for renewal within 24 hours prior to the end of the current period at the rate of your selected plan.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">3.4 Cancellation</h3>
            <p className="text-foreground/80 mb-4">
              You may cancel your subscription at any time through your Apple ID account settings (Settings → Apple ID → Subscriptions). Cancellation takes effect at the end of the current billing period; you will retain access to Ladybosslook+ features until that date. No partial refunds are provided for unused portions of a subscription period.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">3.5 Refunds</h3>
            <p className="text-foreground/80 mb-4">
              All subscription payments are processed by Apple through the App Store. Refund requests must be submitted directly to Apple. For more information, visit{' '}
              <a href="https://support.apple.com/en-us/HT204084" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Apple's refund support page
              </a>.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">3.6 Price Changes</h3>
            <p className="text-foreground/80 mb-4">
              We may change subscription pricing at any time. If the price increases, Apple will notify you in advance and require your consent before the new price takes effect. If you do not consent, your subscription will be cancelled at the end of the current period.
            </p>
          </section>

          {/* ── 4. User Conduct ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. User Conduct</h2>
            <p className="text-foreground/80 mb-4">
              You agree not to use the App to post or share content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable. We reserve the right to remove content and suspend accounts that violate these Terms.
            </p>
          </section>

          {/* ── 5. Intellectual Property ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Intellectual Property</h2>
            <p className="text-foreground/80 mb-4">
              All content in the App — including audio programs, text, graphics, logos, and software — is the property of Ali Lotfi or its licensors and is protected by copyright and intellectual property laws. You may not reproduce, distribute, or create derivative works from any content without prior written consent.
            </p>
          </section>

          {/* ── 6. Disclaimer & Limitation of Liability ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Disclaimer</h2>
            <p className="text-foreground/80 mb-4">
              The App provides general wellness information and tools. It is not a substitute for professional medical, psychological, or health advice. Always consult a qualified professional before making health decisions. The App is provided "as is" without warranties of any kind, express or implied.
            </p>
            <p className="text-foreground/80 mb-4">
              To the maximum extent permitted by law, Ali Lotfi shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the App.
            </p>
          </section>

          {/* ── 7. Privacy ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Privacy</h2>
            <p className="text-foreground/80 mb-4">
              Your use of the App is also governed by our{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. By using the App, you consent to the collection and use of information as described in the Privacy Policy.
            </p>
          </section>

          {/* ── 8. SMS / Messaging Terms ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Messaging Terms & Conditions</h2>
            <p className="text-foreground/80 mb-4">
              When you opt-in to the service, we will send you a message to confirm your signup.
            </p>
            <p className="text-foreground/80 mb-4">
              By opting into messages, you agree to receive recurring automated marketing and informational text messages from Ali Lotfi. Automated messages may be sent using an automatic telephone dialing system to the mobile telephone number you provided when signing up or any other number that you designate.
            </p>
            <p className="text-foreground/80 mb-4">
              Message frequency varies, and additional mobile messages may be sent periodically based on your interaction with Ali Lotfi. Ali Lotfi reserves the right to alter the frequency of messages sent at any time, to increase or decrease the total number of sent messages, and to change the short code or phone number where messages are sent.
            </p>
            <p className="text-foreground/80 mb-4">
              Your usual message and data rates may apply. Contact your mobile provider for questions about your text or data plan. Your mobile provider is not liable for delayed or undelivered messages. Carriers are not liable for delayed or undelivered messages.
            </p>
            <p className="text-foreground/80 mb-4">
              Your consent to receive marketing messages is not a condition of purchase.
            </p>
            <p className="text-foreground/80 mb-4">
              <strong>Cancellation:</strong> Messages will provide instructions to unsubscribe either by texting STOP or through an included link. After you unsubscribe, we will send a confirmation message and no more messages will be sent. To receive messages again, simply sign up as you did the first time.
            </p>
            <p className="text-foreground/80 mb-4">
              <strong>Help:</strong> For support, email us at{' '}
              <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a>{' '}
              or, if supported, text "HELP" to{' '}
              <a href="tel:4155428062" className="text-primary hover:underline">(415) 542-8062</a>.
            </p>
            <p className="text-foreground/80 mb-4">
              <strong>Transfer of Number:</strong> You agree that before changing or transferring your mobile number, you will either reply "STOP" from the original number or notify us at{' '}
              <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a>.
            </p>
          </section>

          {/* ── 9. Governing Law ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Governing Law</h2>
            <p className="text-foreground/80 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles.
            </p>
          </section>

          {/* ── 10. Contact ── */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
            <p className="text-foreground/80 mb-4">
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a>.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SMSTerms;
