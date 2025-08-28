import { SEOHead } from "@/components/SEOHead";

const SMSTerms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="SMS Terms & Conditions - Ali Lotfi"
        description="Read the terms and conditions for SMS messaging services from Ali Lotfi. Learn about message frequency, cancellation, and privacy policies."
        url={typeof window !== 'undefined' ? `${window.location.origin}/sms-terms` : ''}
      />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Messaging Terms & Conditions</h1>
          <div className="bg-muted p-6 rounded-lg">
            <p className="text-foreground font-medium mb-2">Ali Lotfi</p>
            <p className="text-foreground/80 mb-1">2403 Elements Way # 2403</p>
            <p className="text-foreground/80 mb-1">Irvine CA US 92612-1536</p>
            <p className="text-foreground/80 mb-1">
              <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">hi@ladybosslook.com</a>
            </p>
            <p className="text-foreground/80 mb-1">(415) 542-8062</p>
            <p className="text-foreground/80">
              <a href="http://eepurl.com/jl_Tog" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                http://eepurl.com/jl_Tog
              </a>
            </p>
          </div>
        </header>

        <main className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">General</h2>
            <p className="text-foreground/80 mb-4">
              When you opt-in to the service, we will send you a message to confirm your signup.
            </p>
            <p className="text-foreground/80 mb-4">
              By opting into messages, you agree to receive recurring automated marketing and informational text messages from Ali Lotfi. Automated messages may be sent using an automatic telephone dialing system to the mobile telephone number you provided when signing up or any other number that you designate.
            </p>
            <p className="text-foreground/80 mb-4">
              Message frequency varies, and additional mobile messages may be sent periodically based on your interaction with Ali Lotfi. Ali Lotfi reserves the right to alter the frequency of messages sent at any time to increase or decrease the total number of sent messages. Ali Lotfi also reserves the right to change the short code or phone number or alphanumeric sender where messages are sent.
            </p>
            <p className="text-foreground/80 mb-4">
              Your usual message and data rates may apply. If you have any questions about your text plan or data plan, it is best to contact your mobile provider. Your mobile provider is not liable for delayed or undelivered messages.
            </p>
            <p className="text-foreground/80 mb-6">
              Your consent to receive marketing messages is not a condition of purchase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Carriers</h2>
            <p className="text-foreground/80 mb-6">
              Carriers are not liable for delayed or undelivered messages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Cancellation</h2>
            <p className="text-foreground/80 mb-6">
              Messages will provide instructions to unsubscribe either by texting STOP or through an included link. After you unsubscribe, we will send you a message to confirm that you have been unsubscribed and no more messages will be sent. If you would like to receive messages from Ali Lotfi again, just sign up as you did the first time and Ali Lotfi will start sending messages to you again.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Info</h2>
            <p className="text-foreground/80 mb-6">
              For support regarding our services, email us at{' '}
              <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">
                hi@ladybosslook.com
              </a>{' '}
              or, if supported, text "HELP" to{' '}
              <a href="tel:4155428062" className="text-primary hover:underline">
                4155428062
              </a>{' '}
              at any time and we will respond with instructions on how to unsubscribe. If we include a link in messages we send you from Ali Lotfi, you may also access instructions on how to unsubscribe and our company information by following that link.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Transfer of Number</h2>
            <p className="text-foreground/80 mb-6">
              You agree that before changing your mobile number or transferring your mobile number to another individual, you will either reply "STOP" from the original number or notify us of your old number at{' '}
              <a href="mailto:hi@ladybosslook.com" className="text-primary hover:underline">
                hi@ladybosslook.com
              </a>
              . The duty to inform us based on the above events is a condition of using this service to receive messages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Privacy</h2>
            <p className="text-foreground/80 mb-6">
              If you have any questions about your data or our privacy practices, please visit our{' '}
              <a 
                href="http://eepurl.com/jl_Tog" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                privacy policy
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Messaging Terms Changes</h2>
            <p className="text-foreground/80 mb-6">
              We reserve the right to change or terminate our messaging program at any time. We also reserve the right to update these Messaging Terms at any time. Such changes will be effective immediately upon posting. If you do not agree to a change to these Messaging Terms, you should cancel your enrolment with our messaging program. Your continued enrollment following such changes shall constitute your acceptance of such changes.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SMSTerms;