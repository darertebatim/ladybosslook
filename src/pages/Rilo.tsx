import { Helmet } from 'react-helmet-async';
import {
  Apple,
  Play,
  Sparkles,
  ArrowRight,
  Heart,
  Wind,
  BookOpen,
  Timer,
  Headphones,
  MessageCircle,
  Smile,
  Calendar,
  ListChecks,
  Target,
  CheckCircle2,
  Flame,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import heroScreenshot from '@/assets/rilo-screenshot-quiz-intro.png';
import quizStepScreenshot from '@/assets/rilo-screenshot-quiz-step.png';
import quizStep2Screenshot from '@/assets/rilo-screenshot-quiz-step2.png';
import appIcon from '@/assets/rilo-app-icon.png';

const APP_STORE_URL = 'https://apps.apple.com/app/rilo-self-care-routines/id6755076134';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ladybosslook.academy';

/**
 * iPhone-style mockup frame. Wraps an app screenshot in a device bezel
 * with side buttons, dynamic island, and an inner shadow.
 */
function PhoneFrame({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <div
      className={`relative aspect-[9/19.5] rounded-[2.75rem] bg-[hsl(20,8%,12%)] p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45),0_8px_20px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/20 ${className}`}
    >
      {/* Side buttons */}
      <span className="absolute left-[-3px] top-[18%] h-[42px] w-[3px] rounded-l-sm bg-[hsl(20,8%,18%)]" aria-hidden />
      <span className="absolute left-[-3px] top-[28%] h-[68px] w-[3px] rounded-l-sm bg-[hsl(20,8%,18%)]" aria-hidden />
      <span className="absolute left-[-3px] top-[36%] h-[68px] w-[3px] rounded-l-sm bg-[hsl(20,8%,18%)]" aria-hidden />
      <span className="absolute right-[-3px] top-[24%] h-[100px] w-[3px] rounded-r-sm bg-[hsl(20,8%,18%)]" aria-hidden />

      {/* Screen */}
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-black">
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover object-top"
          loading={eager ? 'eager' : 'lazy'}
        />
        {/* Dynamic Island */}
        <div
          className="pointer-events-none absolute left-1/2 top-2 z-10 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-black"
          aria-hidden
        />
        {/* Subtle inner highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[2.1rem] ring-1 ring-inset ring-white/5"
          aria-hidden
        />
      </div>
    </div>
  );
}

const faqs = [
  {
    q: 'Is Rilo free to use?',
    a: 'Yes. The Self-Care Quiz, daily planner, routine templates, mood check-in, reflections, reading library, and community chats are all free. Simora Plus unlocks unlimited routines and tasks, AI Agents, Fasting, Period, Projects, and premium audio.',
  },
  {
    q: 'What is the Self-Care Quiz?',
    a: 'A 1-minute diagnostic that maps where you are across 14 self-care areas — sleep, calm, nutrition, connection, movement, and more. You get a personal diagnosis and a ready-to-launch routine in one tap.',
  },
  {
    q: 'Does Rilo work offline?',
    a: 'Yes. Your planner, routines, journal, and previously played audio work offline. Streaming content needs a connection, but the app is built native-first with persistent caching.',
  },
  {
    q: 'How much is Simora Plus?',
    a: 'Simora Plus is the optional premium tier. Pricing varies by region and is shown clearly in the app before any purchase. You can start with the free tier and upgrade anytime.',
  },
  {
    q: 'What languages does Rilo support?',
    a: 'Rilo supports English and Persian (Farsi) across the interface, reflections journal prompts, and parts of the audio library. More languages are on the roadmap.',
  },
];

const tools = [
  {
    icon: Play,
    name: 'Routine Player',
    text: 'Guided, timer-aware playback of your daily routines. Background-safe so it keeps going when your screen locks — perfect for morning rituals, focus blocks, and evening wind-downs.',
  },
  {
    icon: Calendar,
    name: 'Routine Templates',
    text: 'A library of ready-made rituals — Daily Reset, Morning Calm, Sleep Wind-Down, Focus Sprint, and more. Adopt one in a tap, then customize at your pace.',
  },
  {
    icon: Target,
    name: 'Self-Care Goals',
    text: 'Pick the areas that matter to you right now: sleep, calm, nutrition, movement, hygiene, connection, kindness, gratitude. Goals quietly shape what your planner suggests.',
  },
  {
    icon: Wind,
    name: 'Breathe',
    text: 'Immersive breathing exercises with full-screen visuals. Box breathing, 4-7-8, calm-down, energize — drop into one whenever the day needs a soft reset.',
  },
  {
    icon: BookOpen,
    name: 'Reflections Journal',
    text: 'A bilingual journal (English & Farsi) with guided prompts and free writing. Capture mood, gratitude, and end-of-day notes — privately, or share with your coach.',
  },
  {
    icon: Timer,
    name: 'Focus Timer',
    text: 'Pomodoro and free timer modes with background-safe wall-clock sync. Logs your focus sessions automatically and feeds your weekly review.',
  },
  {
    icon: Smile,
    name: 'Mood Check-in & Emotions',
    text: 'A quick daily mood log, plus a deeper Emotions tracker to name what you actually feel. Patterns surface gently over time — no judgment, just clarity.',
  },
  {
    icon: Headphones,
    name: 'Listen',
    text: 'A streaming library of guided meditations, soundscapes, sleep stories, and audio classes. Pick a playlist for the moment you\'re in.',
  },
  {
    icon: BookOpen,
    name: 'Read & Learn',
    text: 'Free micro-lessons and stories — including the Ladyboss series. Short enough for a coffee break, deep enough to leave a mark.',
  },
  {
    icon: MessageCircle,
    name: 'Community Chats',
    text: 'Telegram-style channels where women share progress, ask questions, and cheer each other on. You\'re not doing this alone.',
  },
  {
    icon: GraduationCap,
    name: 'Online Classes & Programs',
    text: 'Live and self-paced courses delivered inside the app — with session schedules, drip content, and program-specific community channels.',
  },
];

const StoreBadges = ({ size = 'default' as 'default' | 'sm' }) => (
  <div className="flex flex-wrap gap-3">
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-2xl bg-[hsl(20,15%,15%)] px-5 text-white shadow-sm transition hover:scale-[1.02] ${
        size === 'sm' ? 'h-11 text-sm' : 'h-14 text-base'
      }`}
      aria-label="Download Rilo on the App Store"
    >
      <Apple className="h-5 w-5" aria-hidden />
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[10px] opacity-80">Download on the</span>
        <span className="font-semibold">App Store</span>
      </span>
    </a>
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-2xl bg-[hsl(20,15%,15%)] px-5 text-white shadow-sm transition hover:scale-[1.02] ${
        size === 'sm' ? 'h-11 text-sm' : 'h-14 text-base'
      }`}
      aria-label="Get Rilo on Google Play"
    >
      <Play className="h-5 w-5" aria-hidden />
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[10px] opacity-80">Get it on</span>
        <span className="font-semibold">Google Play</span>
      </span>
    </a>
  </div>
);

const Rilo = () => {
  const pageTitle = 'Rilo — Self-Care Tracker & Routine Planner';
  const pageDescription =
    "Take the 1-minute Self-Care Quiz and get your personal plan. Rilo helps you take better care of yourself — starting today. Free on iOS and Android.";
  const pageUrl = 'https://ladybosslook.com/rilo';
  const ogImage = 'https://ladybosslook.com/rilo-og.jpg';

  const softwareLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Rilo — Self-Care Tracker & Routine Planner',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'HealthApplication',
    description: pageDescription,
    image: `https://ladybosslook.com${appIcon}`,
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
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(softwareLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b border-[hsl(35,30%,88%)] bg-[hsl(35,40%,97%)]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2">
            <img
              src={appIcon}
              alt="Rilo app icon"
              className="h-9 w-9 rounded-[0.65rem] shadow-sm ring-1 ring-black/5"
            />
            <span className="text-lg font-semibold tracking-tight">Rilo</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-[hsl(20,10%,40%)] md:flex">
            <a href="#quiz" className="hover:text-[hsl(20,15%,15%)]">Quiz</a>
            <a href="#journey" className="hover:text-[hsl(20,15%,15%)]">Journey</a>
            <a href="#tools" className="hover:text-[hsl(20,15%,15%)]">Tools</a>
            <a href="#plus" className="hover:text-[hsl(20,15%,15%)]">Plus</a>
            <a href="#faq" className="hover:text-[hsl(20,15%,15%)]">FAQ</a>
          </nav>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[hsl(20,15%,15%)] px-4 text-sm font-medium text-white transition hover:scale-[1.02]"
          >
            Take the Quiz
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(35,55%,94%)] via-[hsl(35,40%,97%)] to-[hsl(35,40%,97%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[hsl(150,40%,25%)] ring-1 ring-[hsl(150,30%,80%)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Rilo — Self-Care Tracker & Routine Planner
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Let me guess…<br />
              <span className="text-[hsl(15,55%,45%)]">you&apos;ve stopped taking care of yourself.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[hsl(20,10%,35%)]">
              Take the 1-minute quiz and get your personal self-care plan.
              Take better care of yourself — starting today.
            </p>
            <div className="mt-8">
              <StoreBadges />
            </div>
            <p className="mt-4 text-sm text-[hsl(20,10%,45%)]">
              Free to start · No account needed for the quiz · iOS & Android
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[hsl(150,30%,85%)]/40 blur-2xl" />
            <PhoneFrame
              src={heroScreenshot}
              alt="Rilo Self-Care Quiz screen — Discover your self-care gaps in 1 minute"
              className="mx-auto w-full max-w-[240px]"
              eager
            />
          </div>
        </div>
      </section>

      {/* Quiz — hero feature */}
      <section id="quiz" className="border-t border-[hsl(35,30%,88%)] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="text-sm font-medium uppercase tracking-widest text-[hsl(15,55%,45%)]">
                The Self-Care Quiz
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Start with what&apos;s missing.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[hsl(20,10%,35%)]">
                Four gentle questions. One minute. Rilo maps where you are across <strong>14 self-care
                areas</strong> — sleep, calm, nutrition, hygiene, movement, connection, kindness,
                gratitude, presence, and more.
              </p>
              <p className="mt-3 text-lg leading-relaxed text-[hsl(20,10%,35%)]">
                You finish with a personal diagnosis, suggested goals, and a routine you can launch in one tap.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Sparkles, label: '1-minute quiz' },
                  { icon: Target, label: 'Personal goals' },
                  { icon: ListChecks, label: 'Ready routine' },
                  { icon: Heart, label: 'No pressure' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center gap-3 rounded-2xl bg-[hsl(35,55%,96%)] px-4 py-3 ring-1 ring-[hsl(35,30%,88%)]"
                  >
                    <b.icon className="h-4 w-4 text-[hsl(15,55%,45%)]" aria-hidden />
                    <span className="text-sm font-medium">{b.label}</span>
                  </div>
                ))}
              </div>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[hsl(15,55%,45%)] px-6 text-sm font-semibold text-white transition hover:scale-[1.02]"
              >
                Take the Self-Care Quiz
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-[hsl(15,70%,90%)] to-[hsl(150,30%,88%)] blur-2xl" />
              <div className="rounded-[2rem] bg-[hsl(35,55%,96%)] p-6 shadow-xl ring-1 ring-[hsl(35,30%,88%)]">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(15,55%,45%)]">
                    Question 2 of 4
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    Be honest… which of these have you been neglecting?
                  </h3>
                  <div className="mt-5 space-y-2">
                    {[
                      { e: '😴', t: 'Sleep & rest' },
                      { e: '💧', t: 'Water & nutrition' },
                      { e: '🧘', t: 'Moments of stillness', sel: true },
                      { e: '💬', t: 'Connecting with someone' },
                      { e: '🧴', t: 'Skincare & grooming', sel: true },
                    ].map((o) => (
                      <div
                        key={o.t}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                          o.sel
                            ? 'border-[hsl(15,55%,45%)] bg-[hsl(15,70%,96%)] font-medium'
                            : 'border-[hsl(35,30%,90%)] bg-white'
                        }`}
                      >
                        <span className="text-base">{o.e}</span>
                        <span>{o.t}</span>
                        {o.sel && (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-[hsl(15,55%,45%)]" aria-hidden />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section id="journey" className="border-t border-[hsl(35,30%,88%)]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="max-w-2xl">
            <span className="text-sm font-medium uppercase tracking-widest text-[hsl(15,55%,45%)]">
              Your Self-Care Journey
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Plan. Practice. Reflect.
            </h2>
            <p className="mt-4 text-lg text-[hsl(20,10%,35%)]">
              A complete loop built around how self-care actually works — not a checklist that punishes you
              when life gets messy.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                tag: 'Plan',
                title: 'Know what you need.',
                body: 'Take the Self-Care Quiz, set your personal goals, and pick a routine template that fits your life right now.',
                icon: Target,
              },
              {
                tag: 'Practice',
                title: 'Show up, gently.',
                body: 'Use the Routine Player, breathe, journal, listen, focus, and read — small daily acts that compound.',
                icon: Sparkles,
              },
              {
                tag: 'Reflect',
                title: 'See your patterns.',
                body: 'Mood check-ins, weekly self-care reviews, and Presence streaks show you what\'s working — and what to change.',
                icon: RefreshCw,
              },
            ].map((p) => (
              <article
                key={p.tag}
                className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-[hsl(35,30%,88%)]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[hsl(150,30%,90%)]">
                    <p.icon className="h-5 w-5 text-[hsl(150,40%,25%)]" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(15,55%,45%)]">
                    {p.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-[hsl(20,10%,40%)]">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Review */}
      <section className="border-t border-[hsl(35,30%,88%)] bg-[hsl(150,25%,96%)]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-5 md:py-24">
          <div className="md:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-[hsl(150,20%,85%)]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(150,40%,25%)]">
                Weekly Self-Care Review
              </p>
              <h3 className="mt-2 text-lg font-semibold">Your balance this week</h3>
              <div className="mt-5 space-y-4">
                {[
                  { label: 'Body', pct: 78, color: 'hsl(15,55%,55%)' },
                  { label: 'Mind', pct: 64, color: 'hsl(280,40%,55%)' },
                  { label: 'Environment', pct: 42, color: 'hsl(35,70%,55%)' },
                  { label: 'People', pct: 56, color: 'hsl(150,40%,40%)' },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{b.label}</span>
                      <span className="text-[hsl(20,10%,45%)]">{b.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[hsl(150,20%,92%)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${b.pct}%`, background: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-[hsl(35,55%,96%)] p-4 text-sm">
                <p className="font-medium">💡 Suggestion for next week</p>
                <p className="mt-1 text-[hsl(20,10%,40%)]">
                  Add one tidy-up moment to your evenings — your Environment score has been quiet.
                </p>
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <span className="text-sm font-medium uppercase tracking-widest text-[hsl(150,40%,25%)]">
              Weekly Review
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              A gentle check-in every week.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[hsl(20,10%,35%)]">
              Once a week, Rilo invites you to pause. Not to judge — to notice. You see your
              <strong> Self-Care Balance</strong> across <strong>Body · Mind · Environment · People</strong>,
              your top 3 habits, your returns to the app, and a satisfaction slider that asks how the week
              actually felt.
            </p>
            <p className="mt-3 text-lg leading-relaxed text-[hsl(20,10%,35%)]">
              Then it offers small, specific suggestions — what to drop, what to try next — so the next
              week starts with intention, not guilt.
            </p>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="border-t border-[hsl(35,30%,88%)]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="max-w-2xl">
            <span className="text-sm font-medium uppercase tracking-widest text-[hsl(15,55%,45%)]">
              Everything in one place
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Tools that meet you where you are.
            </h2>
            <p className="mt-4 text-lg text-[hsl(20,10%,35%)]">
              Each tool is small enough to use in a spare minute, and deep enough to grow with you.
            </p>
          </div>

          <div className="mt-14 flex flex-col-reverse items-start gap-12 md:flex-row md:items-center">
            <div className="relative flex w-full items-end justify-center gap-6 md:w-1/2">
              <PhoneFrame
                src={quizStepScreenshot}
                alt="Self-Care Quiz — What do you struggle with most?"
                className="w-[40%] max-w-[160px] -rotate-3"
              />
              <PhoneFrame
                src={quizStep2Screenshot}
                alt="Self-Care Quiz — What sounds most helpful to you?"
                className="w-[40%] max-w-[160px] rotate-3"
              />
            </div>
            <p className="text-lg leading-relaxed text-[hsl(20,10%,35%)] md:w-1/2">
              Rilo brings together your routines, breathing, journaling, focus, mood, audio, reading, and
              community. No tab-hopping. Just one calm space — patiently introducing each tool when you&apos;re
              ready for it.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {tools.map((t) => (
              <article
                key={t.name}
                className="flex gap-4 rounded-3xl bg-white p-6 ring-1 ring-[hsl(35,30%,88%)]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[hsl(35,55%,94%)]">
                  <t.icon className="h-5 w-5 text-[hsl(15,55%,45%)]" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <p className="mt-1.5 text-[hsl(20,10%,40%)]">{t.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Free vs Plus */}
      <section id="plus" className="border-t border-[hsl(35,30%,88%)] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="max-w-2xl">
            <span className="text-sm font-medium uppercase tracking-widest text-[hsl(15,55%,45%)]">
              Free & Simora Plus
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Most of Rilo is free.
            </h2>
            <p className="mt-4 text-lg text-[hsl(20,10%,35%)]">
              The full self-care loop works on the free plan. Simora Plus exists for people who want more
              depth, more tools, and unlimited routines.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl bg-[hsl(35,55%,96%)] p-8 ring-1 ring-[hsl(35,30%,88%)]">
              <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(20,10%,45%)]">Free</p>
              <h3 className="mt-2 text-2xl font-semibold">The full self-care loop</h3>
              <ul className="mt-5 space-y-3 text-[hsl(20,10%,30%)]">
                {[
                  'Self-Care Quiz & personal plan',
                  'Daily planner & routine templates',
                  'Mood check-in & emotions',
                  'Reflections journal (EN & Farsi)',
                  'Read & Learn library',
                  'Community chats',
                  'Weekly self-care review',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(150,40%,40%)]" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-3xl bg-gradient-to-br from-[hsl(20,15%,15%)] to-[hsl(20,20%,25%)] p-8 text-white ring-1 ring-black/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[hsl(45,90%,70%)]" aria-hidden />
                <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(45,90%,70%)]">
                  Simora Plus
                </p>
              </div>
              <h3 className="mt-2 text-2xl font-semibold">Go deeper, without limits</h3>
              <ul className="mt-5 space-y-3 text-white/85">
                {[
                  'Unlimited routines & tasks',
                  'AI Agents — coach, assistant, companion',
                  'Fasting tracker',
                  'Period tracker',
                  'Projects (mobile project manager)',
                  'Premium audio & guided programs',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(45,90%,70%)]" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-white/60">
                Pricing shown in-app and varies by region. Cancel anytime.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Streaks & Presence */}
      <section className="border-t border-[hsl(35,30%,88%)]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-24">
          <div>
            <span className="text-sm font-medium uppercase tracking-widest text-[hsl(15,55%,45%)]">
              Streaks & Presence
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Small wins, every day.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[hsl(20,10%,35%)]">
              Finish 1 task for <strong>Bronze</strong>, 2 for <strong>Silver</strong>, 3 for{' '}
              <strong>Gold</strong>. Streaks build slowly, recovery shields catch you on hard days, and
              Presence shows your real engagement — focus time, returns, tasks done — across the whole week.
            </p>
            <p className="mt-3 text-lg leading-relaxed text-[hsl(20,10%,35%)]">
              No streak shame. Just gentle momentum.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Bronze', emoji: '🥉', bg: 'hsl(25,60%,90%)' },
              { label: 'Silver', emoji: '🥈', bg: 'hsl(220,15%,90%)' },
              { label: 'Gold', emoji: '🥇', bg: 'hsl(45,80%,88%)' },
            ].map((b) => (
              <div
                key={b.label}
                className="flex flex-col items-center justify-center rounded-3xl p-6 text-center shadow-sm ring-1 ring-[hsl(35,30%,88%)]"
                style={{ background: b.bg }}
              >
                <span className="text-4xl">{b.emoji}</span>
                <p className="mt-3 text-sm font-semibold">{b.label}</p>
              </div>
            ))}
            <div className="col-span-3 flex items-center gap-3 rounded-3xl bg-white p-5 ring-1 ring-[hsl(35,30%,88%)]">
              <Flame className="h-5 w-5 text-[hsl(15,55%,45%)]" aria-hidden />
              <p className="text-sm">
                <strong>Recovery shields</strong> protect your streak when life gets in the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[hsl(35,30%,88%)] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 md:py-24">
          <span className="text-sm font-medium uppercase tracking-widest text-[hsl(15,55%,45%)]">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Honest answers.
          </h2>
          <div className="mt-10 divide-y divide-[hsl(35,30%,88%)]">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-medium">
                  {f.q}
                  <span className="ml-4 text-[hsl(20,10%,45%)] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-[hsl(20,10%,40%)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[hsl(35,30%,88%)] bg-gradient-to-b from-[hsl(35,55%,94%)] to-[hsl(15,55%,90%)]">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Take the 1-minute quiz. Get your plan.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[hsl(20,10%,35%)]">
            Take better care of yourself — starting today.
          </p>
          <div className="mt-10 flex justify-center">
            <StoreBadges />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(35,30%,88%)] bg-[hsl(35,40%,97%)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 text-sm text-[hsl(20,10%,45%)] md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <img
              src={appIcon}
              alt="Rilo app icon"
              className="h-8 w-8 rounded-[0.55rem] shadow-sm ring-1 ring-black/5"
            />
            <span className="font-semibold text-[hsl(20,15%,15%)]">Rilo</span>
            <span>· Self-Care Tracker & Routine Planner</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <a href="/privacy" className="hover:text-[hsl(20,15%,15%)]">Privacy</a>
            <a href="/terms" className="hover:text-[hsl(20,15%,15%)]">Terms</a>
            <a href="/delete-account" className="hover:text-[hsl(20,15%,15%)]">Delete account</a>
            <a href="mailto:hello@ladybosslook.com" className="hover:text-[hsl(20,15%,15%)]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Rilo;