import { SEOHead } from "@/components/SEOHead";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">
            <strong>Effective:</strong> January 21, 2026
          </p>
        </header>

        <main className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">About Us</h2>
            <p className="text-foreground/80 mb-6">
              "We", "us" or "our" means Ladybosslook LLC., with its principal place of business located at 2403 Elements Way # 2403 Irvine CA US 92612-1536.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">About This Privacy Policy</h2>
            <p className="text-foreground/80 mb-4">
              Your privacy is important to us, so we've developed this Privacy Policy, which explains how we collect, use, and disclose your personal information. We collect personal information when you use our website(s), mobile apps, and other online and offline products, services and experiences (collectively, the "Services"). Please take a moment to read through this Policy in its entirety.
            </p>
            <p className="text-foreground/80 mb-6">
              If you have any questions, concerns or complaints regarding this Privacy Policy or how we use your personal information please contact us via e-mail at <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">What Personal Information We Collect and How We Collect It?</h2>
            <p className="text-foreground/80 mb-4">We collect personal information that you provide directly to us:</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">Contact information.</h3>
                <p className="text-foreground/80">If you sign up to receive our newsletter, emails, or text messages from us, we will collect your name, email address, mailing address, phone number, and any other information needed to contact you about the Services.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">Payment information.</h3>
                <p className="text-foreground/80">To order products or services through the Services, you will need to provide us with payment information (like your bank account or credit card information). Please note that your financial information is collected and stored by a third party payment processing company. Use and storage of that information is governed by the third party payment processor's applicable privacy policy.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">Survey information.</h3>
                <p className="text-foreground/80">You may provide us with other personal information when you fill in a form, respond to our surveys or questionnaires, provide us with feedback, participate in promotions, or use other features of the Services.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">User-generated content.</h3>
                <p className="text-foreground/80">When you use our mobile app or website, you may create and share content including:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-foreground/80">
                  <li><strong>Journal entries:</strong> Private mood tracking and personal reflections stored securely in your account.</li>
                  <li><strong>Community posts:</strong> Content you share in the community feed, which may be visible to other enrolled users.</li>
                  <li><strong>Chat messages:</strong> Text and voice messages you send to our support team.</li>
                  <li><strong>Attachments:</strong> Photos, files, and voice recordings you upload through the app.</li>
                  <li><strong>Tasks and routines:</strong> Personal productivity data including tasks, habits, and routine completions.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Device Permissions</h2>
            <p className="text-foreground/80 mb-4">Our mobile app may request the following device permissions to provide specific features:</p>
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">Camera and Photo Library.</h3>
                <p className="text-foreground/80">Used to attach photos to chat messages and community posts. We only access photos you explicitly select or capture.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">Microphone.</h3>
                <p className="text-foreground/80">Used to record voice messages in chat support. Audio is only recorded when you actively press and hold the record button.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">Calendar.</h3>
                <p className="text-foreground/80">Used to add course sessions and tasks to your device calendar. We request write-only access and do not read your existing calendar events.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">Push Notifications.</h3>
                <p className="text-foreground/80">Used to send you course updates, session reminders, and important announcements. You can manage notification preferences in your profile settings.</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Personal Information?</h2>
            <p className="text-foreground/80 mb-4">We use the personal information we collect for the following reasons:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-6">
              <li>To send you our newsletter, or other information or marketing about our Services that you think may be of interest to you.</li>
              <li>To reply to your questions, inquiries, or customer service requests or to send you notices, updates, security alerts, or support and administrative messages.</li>
              <li>To provide you with information about the Services that you request from us or which we feel may interest you.</li>
              <li>To monitor and analyze trends, usage and activities in connection with our Services and to improve the Services.</li>
              <li>To facilitate contests, sweepstakes and promotions, and to process entries and provide prizes and rewards.</li>
              <li>To detect, investigate and prevent fraudulent transactions and other illegal activities on the Services and to protect the rights and property of us and our customers.</li>
              <li>To carry out our obligations arising from any contracts entered into between you and us, including for billing and collection.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">How We Share Your Personal Information?</h2>
            <p className="text-foreground/80 mb-4">We may share your personal information in the following ways:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
              <li>With vendors, consultants, and other service providers who process your personal information on our behalf when they provide services to us, for example data analytics, research, marketing and financial services.</li>
              <li>In connection with, or during negotiations of, any merger, sale of company assets, financing or acquisition of all or a portion of our business by another company.</li>
            </ul>
            <p className="text-foreground/80 mb-6">
              We may be legally required to disclose or share your personal information without your consent in some circumstances, for example to comply with a court order or law enforcement. In such circumstances, we will only disclose your personal data if we have a good-faith belief that such sharing is required under applicable legal obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Your Marketing Choices</h2>
            <p className="text-foreground/80 mb-4">
              When you sign up for a promotion like a sweepstakes, or subscribe to our newsletter or marketing/promotional messages, we use your personal information to help us decide which products, services and offers may be of interest to you.
            </p>
            <p className="text-foreground/80 mb-4">
              We will send marketing messages to you if you have asked us to send you information, bought goods or services from us, or if you provided us with your details when you entered a competition or registered for a promotion. If you opt out of receiving marketing messages, we may still send you non-promotional emails. We will ask for your consent before we share your personal information with any third party for their direct marketing purposes.
            </p>
            <p className="text-foreground/80 mb-6">
              You may unsubscribe from marketing messages through a link we include on messages we send you. You can also ask us to stop sending you marketing messages at any time by contacting us at: <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Retention of Your Data and Deletion</h2>
            <p className="text-foreground/80 mb-4">
              Your personal information will not be kept longer than is necessary for the specific purpose for which it was collected.
            </p>
            <p className="text-foreground/80 mb-4">
              When we decide how long we will keep your information we consider the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure, why we need it, and any relevant legal requirements (such as legal retention and destruction periods).
            </p>
            <p className="text-foreground/80 mb-6">
              The foregoing will, however, not prevent us from retaining any personal information if it is necessary to comply with our legal obligations, in order to file a legal claim or defend ourselves against a legal claim, or for evidential purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Account Deletion</h2>
            <p className="text-foreground/80 mb-4">
              You can delete your account at any time through the app by going to <strong>Profile → Actions → Delete Account</strong>. When you delete your account:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
              <li><strong>Permanently deleted:</strong> Your profile information, journal entries, chat history, community posts, course enrollments, tasks, routines, and push notification subscriptions.</li>
              <li><strong>Retained for legal compliance:</strong> Anonymized payment and order records may be retained for tax, legal, and financial audit purposes. These records are disassociated from your personal identity.</li>
            </ul>
            <p className="text-foreground/80 mb-6">
              Account deletion is immediate and irreversible. You will need to create a new account if you wish to use our Services again.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Children's Privacy</h2>
            <p className="text-foreground/80 mb-6">
              Our Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a> so we can take appropriate action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">International Transfers</h2>
            <p className="text-foreground/80 mb-6">
              We will ensure that any transfer of personal information to countries outside of the United States will take place pursuant to the appropriate safeguards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Privacy Policy</h2>
            <p className="text-foreground/80 mb-6">
              From time to time, we have the right to modify this Privacy Policy. We're likely to update this Privacy Policy in the future and when we make changes. Please come back and check this page from time to time for the latest information on our privacy practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p className="text-foreground/80 mb-4">
              If you have questions or concerns about the information in this Privacy Policy, our handling of your personal information, or your choices and rights regarding such use, please do not hesitate to contact us at:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-foreground font-medium mb-2">Ladybosslook LLC.</p>
              <p className="text-foreground/80 mb-1">2403 Elements Way # 2403</p>
              <p className="text-foreground/80 mb-1">Irvine CA US 92612-1536</p>
              <p className="text-foreground/80">
                <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a>
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Privacy;