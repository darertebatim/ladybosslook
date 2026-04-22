import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Apple, Play, Heart, Wind, BookOpen, Timer, Headphones, MessageCircle, Sparkles, ArrowRight, Smile, Calendar } from 'lucide-react';
import heroMockup from '@/assets/rilo-hero-mockup.png';
import featuresTrio from '@/assets/rilo-features-trio.png';

const APP_STORE_URL = 'https://apps.apple.com/app/rilo';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.lovable.rilo';

const Rilo = () => {
  const pageTitle = 'Rilo — Self-Care & Routines for Real Life';
  const pageDescription =
    'Rilo is a gentle self-care companion that helps you rebuild self-trust through small daily rituals — even when life doesn\'t follow a schedule. Free on iOS and Android.';
  const pageUrl = 'https://ladybosslook.com/rilo';
  const ogImage = 'https://ladybosslook.com/rilo-og.jpg';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Rilo — Self-Care & Routines',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'HealthApplication',
    description: pageDescription,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1240' },
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[hsl(35,40%,97%)] text-[hsl(20,15%,15%)] antialiased">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#F8F1E6" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      {/* Top Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[hsl(35,40%,97%)]/80 border-b border-[hsl(30,20%,90%)]">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/rilo" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[hsl(15,70%,75%)] to-[hsl(140,30%,70%)] flex items-center justify-center text-white">
              <Heart className="w-4 h-4" fill="currentColor" />
            </span>
            Rilo
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-[hsl(20,15%,35%)]">
            <a href="#what" className="active:opacity-70">What it is</a>
            <a href="#features" className="active:opacity-70">Features</a>
            <a href="#outcome" className="active:opacity-70">Outcome</a>
            <a href="#faq" className="active:opacity-70">FAQ</a>
          </div>
          <a
            href={APP_STORE_URL}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(20,15%,15%)] text-white text-sm font-medium active:scale-95 transition-transform"
          >
            Download
            <ArrowRight className="w-4 h-4" />
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(25,55%,92%)] via-[hsl(35,40%,97%)] to-[hsl(35,40%,97%)]" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[hsl(15,70%,80%)]/40 blur-3xl -z-10" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-[hsl(140,30%,75%)]/30 blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-[hsl(30,20%,88%)] text-xs font-medium text-[hsl(20,15%,35%)]">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(15,70%,55%)]" />
              A strength companion, not a habit tracker
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
              Your strength, even when life{' '}
              <span className="italic text-[hsl(15,55%,45%)]">doesn't follow</span> a schedule.
            </h1>
            <p className="text-lg text-[hsl(20,15%,35%)] leading-relaxed max-w-xl">
              Rilo helps you rebuild self-trust through small, gentle rituals — designed for new
              parents, caregivers, and anyone whose routines collapsed under real life.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={APP_STORE_URL}
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[hsl(20,15%,15%)] text-white active:scale-95 transition-transform"
              >
                <Apple className="w-6 h-6" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] opacity-80">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </a>
              <a
                href={PLAY_STORE_URL}
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[hsl(20,15%,15%)] text-white active:scale-95 transition-transform"
              >
                <Play className="w-6 h-6" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] opacity-80">Get it on</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </a>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-[hsl(20,15%,40%)]">
              <div>
                <div className="font-semibold text-[hsl(20,15%,15%)]">Free</div>
                <div className="text-xs">to start</div>
              </div>
              <div className="w-px h-8 bg-[hsl(30,20%,85%)]" />
              <div>
                <div className="font-semibold text-[hsl(20,15%,15%)]">iOS & Android</div>
                <div className="text-xs">native apps</div>
              </div>
              <div className="w-px h-8 bg-[hsl(30,20%,85%)]" />
              <div>
                <div className="font-semibold text-[hsl(20,15%,15%)]">No streaks</div>
                <div className="text-xs">no pressure</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroMockup}
              alt="Rilo self-care app showing daily rituals and mood check-in on iPhone"
              width={1024}
              height={1024}
              className="w-full max-w-md mx-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[hsl(15,55%,45%)] font-medium">Why Rilo exists</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            Routines break.{' '}
            <span className="text-[hsl(20,15%,40%)]">That doesn't mean you did.</span>
          </h2>
          <p className="text-lg text-[hsl(20,15%,35%)] leading-relaxed">
            Most apps believe strength comes from consistency. We believe strength comes from staying with
            yourself — even when consistency breaks. Pausing isn't weakness. Returning isn't failure.
            <span className="block mt-3 font-medium text-[hsl(20,15%,15%)]">Returning is strength.</span>
          </p>
        </div>
      </section>

      {/* WHAT RILO IS */}
      <section id="what" className="py-20 lg:py-24 bg-white/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-[hsl(15,55%,45%)] font-medium">What Rilo is</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              Three quiet pillars to help you stay with yourself.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="p-8 rounded-3xl bg-white border border-[hsl(30,20%,90%)] space-y-4"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: p.bg }}
                >
                  <p.icon className="w-6 h-6" style={{ color: p.color }} />
                </div>
                <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                <p className="text-[hsl(20,15%,40%)] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE SHOWCASE */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-[hsl(15,55%,45%)] font-medium">Features</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              Tools that meet you where you are.
            </h2>
          </div>

          <img
            src={featuresTrio}
            alt="Three Rilo screens: breathing exercise, journal, and routine player"
            width={1600}
            height={900}
            loading="lazy"
            className="w-full max-w-4xl mx-auto mb-16"
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-3xl bg-white border border-[hsl(30,20%,90%)]"
              >
                <div
                  className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                  style={{ backgroundColor: f.bg }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-[hsl(20,15%,42%)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 30-DAY OUTCOME */}
      <section
        id="outcome"
        className="py-20 lg:py-28 bg-gradient-to-br from-[hsl(140,25%,90%)] via-[hsl(35,40%,95%)] to-[hsl(15,50%,92%)]"
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-[hsl(15,55%,45%)] font-medium">Your 30 days with Rilo</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              A month from now, you'll feel different.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {outcomes.map((o, i) => (
              <div key={o.title} className="p-8 rounded-3xl bg-white/70 backdrop-blur border border-white">
                <div className="text-5xl font-display text-[hsl(15,55%,45%)] mb-4 font-light">0{i + 1}</div>
                <h3 className="font-display text-xl font-semibold mb-2">{o.title}</h3>
                <p className="text-[hsl(20,15%,40%)] leading-relaxed">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-[hsl(15,55%,45%)] font-medium">Who it's for</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              Built for lives that can't be controlled.
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {audiences.map((a) => (
              <span
                key={a}
                className="px-5 py-2.5 rounded-full bg-white border border-[hsl(30,20%,90%)] text-sm font-medium text-[hsl(20,15%,25%)]"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28 bg-white/60">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14 space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-[hsl(15,55%,45%)] font-medium">FAQ</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              Common questions.
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group p-6 rounded-2xl bg-white border border-[hsl(30,20%,90%)]"
              >
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-base list-none">
                  {f.q}
                  <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-[hsl(20,15%,40%)] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(15,70%,85%)] via-[hsl(25,55%,90%)] to-[hsl(140,30%,85%)]" />
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
            Start gently.
          </h2>
          <p className="text-lg text-[hsl(20,15%,30%)] max-w-xl mx-auto">
            Free to download. No streaks. No guilt. Just a quiet companion to help you return to yourself.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={APP_STORE_URL}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[hsl(20,15%,15%)] text-white active:scale-95 transition-transform"
            >
              <Apple className="w-6 h-6" />
              <div className="text-left leading-tight">
                <div className="text-[10px] opacity-80">Download on the</div>
                <div className="text-sm font-semibold">App Store</div>
              </div>
            </a>
            <a
              href={PLAY_STORE_URL}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[hsl(20,15%,15%)] text-white active:scale-95 transition-transform"
            >
              <Play className="w-6 h-6" />
              <div className="text-left leading-tight">
                <div className="text-[10px] opacity-80">Get it on</div>
                <div className="text-sm font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(30,20%,88%)] py-10 bg-[hsl(35,40%,97%)]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[hsl(20,15%,40%)]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[hsl(15,70%,75%)] to-[hsl(140,30%,70%)] flex items-center justify-center text-white">
              <Heart className="w-3 h-3" fill="currentColor" />
            </span>
            <span>© {new Date().getFullYear()} Rilo. Showing up counts.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="active:opacity-70">Privacy</Link>
            <Link to="/delete-account" className="active:opacity-70">Delete account</Link>
            <Link to="/appsupport" className="active:opacity-70">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const pillars = [
  {
    icon: Sparkles,
    title: 'Rituals, not tasks',
    desc: 'Light, doable actions that honor where you are today. No streaks. No guilt. Just gentle invitations to show up.',
    color: 'hsl(15,55%,45%)',
    bg: 'hsl(15,70%,92%)',
  },
  {
    icon: Heart,
    title: 'Tools that calm',
    desc: 'Breathe, journal, check in with your mood, fast, focus. A library of self-care tools always within reach.',
    color: 'hsl(140,40%,35%)',
    bg: 'hsl(140,30%,90%)',
  },
  {
    icon: MessageCircle,
    title: 'Companionship',
    desc: 'Programs, audio, community chats, and a gentle AI companion. Guidance without the pressure to perform.',
    color: 'hsl(280,40%,45%)',
    bg: 'hsl(280,40%,93%)',
  },
];

const features = [
  { icon: Sparkles, title: 'Daily Rituals', desc: 'Build small, repeatable rituals that fit your real life.', color: 'hsl(15,55%,45%)', bg: 'hsl(15,70%,93%)' },
  { icon: Smile, title: 'Mood Check-in', desc: 'Name what you feel without being ruled by it.', color: 'hsl(45,70%,40%)', bg: 'hsl(45,80%,93%)' },
  { icon: Wind, title: 'Breathing', desc: 'Guided exercises to regulate, not react.', color: 'hsl(190,50%,40%)', bg: 'hsl(190,50%,93%)' },
  { icon: BookOpen, title: 'Journal', desc: 'Free-form reflections and guided prompts.', color: 'hsl(330,40%,45%)', bg: 'hsl(330,40%,94%)' },
  { icon: Timer, title: 'Focus Timer', desc: 'Pomodoro and gentle focus sessions.', color: 'hsl(20,15%,30%)', bg: 'hsl(30,15%,93%)' },
  { icon: Headphones, title: 'Audio Library', desc: 'Stories, lessons, and calming audio for any moment.', color: 'hsl(140,40%,35%)', bg: 'hsl(140,30%,92%)' },
  { icon: Calendar, title: 'Programs', desc: 'Multi-day journeys you can follow at your own pace.', color: 'hsl(220,40%,45%)', bg: 'hsl(220,40%,94%)' },
  { icon: MessageCircle, title: 'Community Chats', desc: 'Connect with others who are also returning to themselves.', color: 'hsl(280,40%,45%)', bg: 'hsl(280,40%,94%)' },
  { icon: Heart, title: 'Reflections', desc: 'Weekly reviews that celebrate showing up.', color: 'hsl(15,55%,45%)', bg: 'hsl(15,70%,94%)' },
];

const outcomes = [
  {
    title: 'You\'ll trust yourself again',
    desc: '"When I say I\'ll show up, I usually do." Self-trust comes back, one small ritual at a time.',
  },
  {
    title: 'You\'ll regulate, not react',
    desc: 'Pause before spiraling. Name emotions without being ruled by them.',
  },
  {
    title: 'You\'ll see yourself differently',
    desc: 'As someone who shows up — even imperfectly, even after absence.',
  },
];

const audiences = [
  'New parents',
  'Caregivers',
  'People in transition',
  'Anyone rebuilding self-trust',
  'Recovering perfectionists',
  'Burnout recovery',
  'Returning after a pause',
];

const faqs = [
  {
    q: 'Is Rilo free?',
    a: 'Yes. Rilo is free to download and use. A premium plan called Simora Plus unlocks deeper tools like Fasting, Period tracking, AI Agents, and Projects.',
  },
  {
    q: 'How is Rilo different from a habit tracker?',
    a: 'Habit trackers measure consistency and punish you for breaks. Rilo is a strength companion — it helps you return to yourself, not maintain a streak. There are no streaks, no guilt, no missed-day penalties.',
  },
  {
    q: 'What\'s included in the free version?',
    a: 'Daily rituals, mood check-ins, breathing exercises, journaling, focus timer, audio library, community chats, and access to free programs.',
  },
  {
    q: 'Is Rilo available on iOS and Android?',
    a: 'Yes. Rilo is a native app available on both the App Store and Google Play.',
  },
  {
    q: 'Who is Rilo for?',
    a: 'Rilo is built for new parents, caregivers, people in transition, and anyone whose routines collapsed under real life — and who wants to rebuild self-trust without pressure.',
  },
  {
    q: 'Does Rilo replace therapy or medical care?',
    a: 'No. Rilo is a self-care companion. It supports your wellbeing but is not a substitute for professional mental health care.',
  },
];

export default Rilo;