import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms of Use | Ladybosslook"
        description="Terms of Use, purchase and billing terms, 30-day refund guarantee, and messaging terms for Ladybosslook, LadyBoss Academy, and the Rilo app."
      />

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center text-primary hover:text-primary/80 mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to home
        </Link>

        <header className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Use</h1>
          <p className="text-foreground/60 text-sm mb-4">Last updated: September 29, 2026</p>
          <div className="bg-muted p-6 rounded-lg">
            <p className="text-foreground font-medium mb-2">Ladybosslook LLC</p>
            <p className="text-foreground/80 mb-1">2403 Elements Way # 2403</p>
            <p className="text-foreground/80 mb-1">Irvine, CA 92612-1536, United States</p>
            <p className="text-foreground/80 mb-1">
              <a href="mailto:support@ladybosslook.com" className="text-primary hover:underline">
                support@ladybosslook.com
              </a>
            </p>
            <p className="text-foreground/80">(415) 542-8062</p>
          </div>
        </header>

        {/* Table of contents */}
        <nav className="mb-12 bg-muted/50 border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">On this page</h2>
          <ol className="list-decimal pl-5 space-y-1 text-foreground/80">
            <li><a href="#acceptance" className="text-primary hover:underline">Acceptance of these Terms</a></li>
            <li><a href="#services" className="text-primary hover:underline">What we provide</a></li>
            <li><a href="#disclaimer" className="text-primary hover:underline">Educational &amp; coaching disclaimer</a></li>
            <li><a href="#accounts" className="text-primary hover:underline">Your account</a></li>
            <li><a href="#purchases" className="text-primary hover:underline">Purchases, billing &amp; payment plans</a></li>
            <li><a href="#refunds" className="text-primary hover:underline">Refund policy &amp; 30-day guarantee</a></li>
            <li><a href="#ip" className="text-primary hover:underline">Intellectual property &amp; license</a></li>
            <li><a href="#conduct" className="text-primary hover:underline">Community standards &amp; conduct</a></li>
            <li><a href="#messaging" className="text-primary hover:underline">Email &amp; SMS messaging terms</a></li>
            <li><a href="#privacy" className="text-primary hover:underline">Privacy</a></li>
            <li><a href="#liability" className="text-primary hover:underline">Disclaimers &amp; limitation of liability</a></li>
            <li><a href="#law" className="text-primary hover:underline">Governing law</a></li>
            <li><a href="#contact" className="text-primary hover:underline">Contact us</a></li>
          </ol>
        </nav>

        <main className="prose prose-lg max-w-none">
          <section id="acceptance" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of these Terms</h2>
            <p className="text-foreground/80 mb-4">
              These Terms of Use ("Terms") are a binding agreement between you and Ladybosslook LLC ("we", "us", "our"). By visiting our websites, creating an account, purchasing a program, joining a live class or webinar, or downloading and using the Rilo mobile app, you agree to these Terms. If you do not agree, please do not use our services.
            </p>
            <p className="text-foreground/80 mb-4">
              We may update these Terms at any time. The version posted on this page is the version in effect. Continued use of our services after changes are posted means you accept the revised Terms. Purchases already completed remain governed by the refund terms in effect on the date of purchase.
            </p>
            <p className="text-foreground/80">
              You must be at least 18 years old, or the age of majority where you live, to purchase our programs.
            </p>
          </section>

          <section id="services" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. What we provide</h2>
            <p className="text-foreground/80 mb-4">
              These Terms cover everything we offer, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Our websites, landing pages, and member dashboard at ladybosslook.com.</li>
              <li>LadyBoss Academy online courses, masterclasses, workshops, and digital downloads.</li>
              <li>Live webinars, group classes, accelerators, and one-on-one coaching sessions.</li>
              <li>The Rilo mobile and web app, including planner, routines, audio programs, reflections, and related tools.</li>
              <li>Community chats, support chat, email newsletters, and text-message notifications.</li>
            </ul>
          </section>

          <section id="disclaimer" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Educational &amp; coaching disclaimer</h2>
            <p className="text-foreground/80 mb-4">
              Our programs are educational and informational. We teach business, marketing, mindset, and self-care skills. We are not a licensed financial advisor, investment advisor, accountant, attorney, physician, or therapist, and nothing we provide is professional financial, legal, tax, medical, or psychological advice.
            </p>
            <p className="text-foreground/80 mb-4">
              <strong>No income or results guarantee.</strong> Any figures, case studies, or student stories we share are examples, not promises. Your results depend on your own effort, experience, market, and many factors outside our control. We do not guarantee any specific income, revenue, follower growth, or business outcome.
            </p>
            <p className="text-foreground/80">
              Wellness features in the Rilo app are for general wellbeing and are not a substitute for professional medical or mental-health care. Always consult a qualified professional before making health decisions.
            </p>
          </section>

          <section id="accounts" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Your account</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Your account and program access are personal to you and for one person only. Sharing login credentials is not permitted.</li>
              <li>You are responsible for keeping your password confidential and for all activity under your account.</li>
              <li>Please give accurate information when registering or purchasing, and keep your email address current so you receive class links and receipts.</li>
              <li>We may suspend or terminate accounts that violate these Terms, share paid content, or abuse our staff or community. Termination for violations does not entitle you to a refund.</li>
              <li>You can request deletion of your account at any time from the <Link to="/delete-account" className="text-primary hover:underline">account deletion page</Link>.</li>
            </ul>
          </section>

          <section id="purchases" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Purchases, billing &amp; payment plans</h2>

            <h3 className="text-xl font-medium text-foreground mb-3">5.1 Prices and payment</h3>
            <p className="text-foreground/80 mb-4">
              Prices are shown before checkout and, unless stated otherwise, are in US dollars. Card payments on our websites are processed securely by Stripe; we never store your full card details. Promotional pricing is valid only for the period stated on the offer.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">5.2 Payment plans and installments</h3>
            <p className="text-foreground/80 mb-4">
              Some programs may be purchased with a payment plan (for example a deposit followed by monthly installments). When you choose a payment plan you authorize us to automatically charge your payment method on each scheduled date until the full program price is paid. You are responsible for the full program price even if you stop using the program. If a payment fails, we may retry the charge and may pause your access until the balance is settled.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">5.3 Recurring subscriptions</h3>
            <p className="text-foreground/80 mb-4">
              Memberships and Rilo Plus are auto-renewing subscriptions. They renew automatically at the end of each billing period at the then-current price until you cancel. You can cancel at any time; cancellation takes effect at the end of the current period and you keep access until that date.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">5.4 In-app purchases</h3>
            <p className="text-foreground/80 mb-4">
              Subscriptions purchased inside the Rilo iOS or Android app are billed by Apple or Google, not by us. Manage or cancel them in your Apple ID or Google Play account settings at least 24 hours before the period ends. Refunds for in-app purchases are handled by Apple (
              <a href="https://support.apple.com/en-us/HT204084" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple's refund page</a>
              ) or Google Play, under their policies.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">5.5 Chargebacks</h3>
            <p className="text-foreground/80">
              Please contact us before disputing a charge with your bank — most issues are resolved in a day. Filing a chargeback instead of requesting a refund may result in immediate loss of access to all programs and to your account.
            </p>
          </section>

          <section id="refunds" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Refund policy &amp; 30-day guarantee</h2>
            <p className="text-foreground/80 mb-6">
              We stand behind the quality of our programs. Below are the refund terms that apply to each type of purchase.
            </p>

            <div className="space-y-5 mb-8">
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-medium text-foreground mb-2">30-day money-back guarantee</h3>
                <p className="text-foreground/80">
                  For our online courses and digital programs, you may request a full refund within 30 days of your purchase date, no questions asked. If your program is shorter than 30 days, the window runs until the program ends.
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-medium text-foreground mb-2">Longer programs (three months and up)</h3>
                <p className="text-foreground/80">
                  You may request a full refund within 30 days of purchase. After the first month, you may request a prorated refund covering the unused remainder of the program.
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-medium text-foreground mb-2">Monthly subscriptions</h3>
                <p className="text-foreground/80">
                  For programs and memberships billed monthly, only the most recent payment is refundable. Earlier payments for months already used are not refunded. Cancelling stops all future charges.
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-medium text-foreground mb-2">Private one-on-one coaching</h3>
                <p className="text-foreground/80">
                  If you are not satisfied with your first session, you may request a refund within 72 hours of that session. Sessions after the first are not refundable.
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-medium text-foreground mb-2">Diamond &amp; Accelerator programs</h3>
                <p className="text-foreground/80">
                  Because of the individual investment we make in each participant, Diamond and Accelerator programs are non-refundable. Please be certain before enrolling, and reach out with any questions first.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-medium text-foreground mb-3">What is not covered</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-6">
              <li>Free courses, free webinars, and complimentary bonuses.</li>
              <li>Downloadable digital products where more than 50% of the files have been downloaded.</li>
              <li>Requests made after the refund window described above has closed.</li>
              <li>Accounts terminated for violating these Terms or sharing paid content.</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">How to request a refund</h3>
            <p className="text-foreground/80 mb-4">Contact us in either of these ways:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
              <li>
                Email{" "}
                <a href="mailto:support@ladybosslook.com" className="text-primary hover:underline">
                  support@ladybosslook.com
                </a>
              </li>
              <li>
                Message us in the{" "}
                <a href="/dashboard/chat" className="text-primary hover:underline">
                  support chat
                </a>
              </li>
            </ul>
            <p className="text-foreground/80 mb-4">
              Please include the name and email you used at checkout and the name of the program you purchased.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">Processing time</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>We review and confirm your request within 24 to 48 hours.</li>
              <li>Approved refunds are returned to your original payment method within 5 to 10 business days.</li>
              <li>The exact timing depends on your bank or card issuer.</li>
              <li>When a purchase is refunded in full, access to that program ends.</li>
            </ul>
          </section>

          <section id="ip" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Intellectual property &amp; license</h2>
            <p className="text-foreground/80 mb-4">
              All course videos, recordings, audio programs, workbooks, templates, frameworks, text, graphics, logos, and software are owned by Ladybosslook LLC or its licensors and are protected by copyright and trademark law.
            </p>
            <p className="text-foreground/80 mb-4">
              When you purchase a program, we grant you a personal, non-transferable, non-exclusive license to access the materials for your own learning. You may not copy, record, screen-capture, republish, resell, translate, distribute, or create derivative works from our materials, or use them to build a competing program, without our prior written permission.
            </p>
            <p className="text-foreground/80">
              Content you post — community posts, chat messages, reflections, and uploads — remains yours. By posting it in shared spaces, you grant us a license to display and store it as needed to operate the service.
            </p>
          </section>

          <section id="conduct" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Community standards &amp; conduct</h2>
            <p className="text-foreground/80 mb-4">
              Our classes, community groups, and support chats are a respectful space. You agree not to post or send content that is unlawful, harassing, hateful, threatening, defamatory, sexually explicit, spam, or promotional of your own offers without permission. Recording or redistributing live sessions is not allowed.
            </p>
            <p className="text-foreground/80">
              We may remove content, mute, or remove participants who breach these standards, and may terminate accounts for serious or repeated violations.
            </p>
          </section>

          <section id="messaging" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Email &amp; SMS messaging terms</h2>
            <p className="text-foreground/80 mb-4">
              When you register for a webinar, join a list, or create an account, we send you related emails such as confirmations, reminders, receipts, and occasional marketing. Every marketing email includes an unsubscribe link. Essential account emails — password resets, login links, and payment receipts — are always sent.
            </p>
            <p className="text-foreground/80 mb-4">
              When you opt in to text messages, we will send a message to confirm your signup. By opting in you agree to receive recurring automated marketing and informational text messages from Ladybosslook LLC, which may be sent using an automatic telephone dialing system to the number you provided.
            </p>
            <p className="text-foreground/80 mb-4">
              Message frequency varies and may change based on your interaction with us. Message and data rates may apply; contact your mobile provider about your text or data plan. Carriers are not liable for delayed or undelivered messages. Your consent to receive marketing messages is not a condition of purchase.
            </p>
            <p className="text-foreground/80 mb-4">
              <strong>Cancellation:</strong> Reply STOP to any message or use the unsubscribe link. We will send one confirmation message and then stop. To start again, simply sign up as you did the first time.
            </p>
            <p className="text-foreground/80 mb-4">
              <strong>Help:</strong> Email{" "}
              <a href="mailto:support@ladybosslook.com" className="text-primary hover:underline">support@ladybosslook.com</a>{" "}
              or, where supported, text HELP to{" "}
              <a href="tel:4155428062" className="text-primary hover:underline">(415) 542-8062</a>.
            </p>
            <p className="text-foreground/80">
              <strong>Changing your number:</strong> Before changing or transferring your mobile number, reply STOP from the original number or let us know at{" "}
              <a href="mailto:support@ladybosslook.com" className="text-primary hover:underline">support@ladybosslook.com</a>.
            </p>
          </section>

          <section id="privacy" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Privacy</h2>
            <p className="text-foreground/80">
              Your use of our services is also governed by our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which explains what information we collect and how we use it.
            </p>
          </section>

          <section id="liability" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Disclaimers &amp; limitation of liability</h2>
            <p className="text-foreground/80 mb-4">
              Our services are provided "as is" and "as available", without warranties of any kind, express or implied. We do not warrant that the services will be uninterrupted, error-free, or that any content will meet your expectations.
            </p>
            <p className="text-foreground/80 mb-4">
              To the maximum extent permitted by law, Ladybosslook LLC and its team are not liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, or data, arising from your use of our services. Our total liability for any claim is limited to the amount you paid us for the program giving rise to the claim in the 12 months before the claim.
            </p>
            <p className="text-foreground/80">
              Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you.
            </p>
          </section>

          <section id="law" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Governing law</h2>
            <p className="text-foreground/80">
              These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles. Any dispute will be brought in the state or federal courts located in Orange County, California, and you consent to their jurisdiction.
            </p>
          </section>

          <section id="contact" className="mb-4 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact us</h2>
            <p className="text-foreground/80 mb-4">
              Questions about these Terms, a refund, or your account? We're happy to help.
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-foreground font-medium mb-2">Ladybosslook LLC</p>
              <p className="text-foreground/80 mb-1">2403 Elements Way # 2403</p>
              <p className="text-foreground/80 mb-1">Irvine, CA 92612-1536, United States</p>
              <p className="text-foreground/80 mb-1">
                Email:{" "}
                <a href="mailto:support@ladybosslook.com" className="text-primary hover:underline">
                  support@ladybosslook.com
                </a>
              </p>
              <p className="text-foreground/80">
                Support chat:{" "}
                <a href="/dashboard/chat" className="text-primary hover:underline">
                  open support chat
                </a>
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Terms;
