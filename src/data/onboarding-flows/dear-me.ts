import { OnboardingFlow } from '@/types/onboarding';

// Image imports
import welcomeImg from '@/assets/onboarding/dear-me/welcome.png';
import greeting1Img from '@/assets/onboarding/dear-me/greeting-1.png';
import greeting2Img from '@/assets/onboarding/dear-me/greeting-2.png';
import focusImg from '@/assets/onboarding/dear-me/focus.png';
import desireGrowImg from '@/assets/onboarding/dear-me/desire-grow.png';
import ynFocusImg from '@/assets/onboarding/dear-me/yn-focus.png';
import ynTiredImg from '@/assets/onboarding/dear-me/yn-tired.png';
import ynBusyImg from '@/assets/onboarding/dear-me/yn-busy.png';
import dywRoutinesImg from '@/assets/onboarding/dear-me/dyw-routines.png';
import dywProductiveImg from '@/assets/onboarding/dear-me/dyw-productive.png';
import dywNoPressureImg from '@/assets/onboarding/dear-me/dyw-no-pressure.png';
import ratingPromptImg from '@/assets/onboarding/dear-me/rating-prompt.png';
import sleepStatImg from '@/assets/onboarding/dear-me/sleep-stat.png';
import motivationalHereImg from '@/assets/onboarding/dear-me/motivational-here.png';
import notificationImg from '@/assets/onboarding/dear-me/notification.png';
import resultsChartImg from '@/assets/onboarding/dear-me/results-chart.png';
import habitLoopImg from '@/assets/onboarding/dear-me/habit-loop.png';
import focusStatImg from '@/assets/onboarding/dear-me/focus-stat.png';
import adhdCbtImg from '@/assets/onboarding/dear-me/adhd-cbt.png';
import loading1Img from '@/assets/onboarding/dear-me/loading-1.png';
import personalSummaryImg from '@/assets/onboarding/dear-me/personal-summary.png';
import breathingPrepImg from '@/assets/onboarding/dear-me/breathing-prep.png';
import breathingImg from '@/assets/onboarding/dear-me/breathing.png';
import paywall1Img from '@/assets/onboarding/dear-me/paywall-1.png';
import paywall2Img from '@/assets/onboarding/dear-me/paywall-2.png';
import motivationalFinalImg from '@/assets/onboarding/dear-me/motivational-final.png';
import scienceBackedImg from '@/assets/onboarding/dear-me/science-backed.png';
import beforeAfterImg from '@/assets/onboarding/dear-me/before-after.png';
import homeScreenImg from '@/assets/onboarding/dear-me/home-screen.png';

export const dearMeFlow: OnboardingFlow = {
  id: 'dear-me-v1',
  name: 'Dear Me Onboarding',
  description: 'Full 50-screen onboarding flow from the Dear Me app',
  appName: 'Dear Me',
  createdAt: '2025-01-01',
  steps: [
    // 1 - Welcome
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Welcome among happy Dear Me users!',
      statHighlight: '25 million+',
      buttonLabel: 'Get started',
      secondaryButtonLabel: 'Already a member? Sign in.',
      illustrationImage: welcomeImg,
      statBadges: [
        { label: 'Featured', value: '⭐' },
        { label: "Users' Favorite", value: '❤️' },
      ],
    },
    // 2 - Greeting 1
    {
      id: 'greeting-1',
      type: 'greeting',
      title: 'Hi there!',
      subtitle: 'Glad to have you here!',
      buttonLabel: 'Continue',
      illustrationImage: greeting1Img,
    },
    // 3 - Greeting 2
    {
      id: 'greeting-2',
      type: 'greeting',
      title: 'Come on,',
      subtitle: "Let's discover a better you together!",
      buttonLabel: 'Continue',
      illustrationImage: greeting2Img,
    },
    // 4 - Multi-select: Focus
    {
      id: 'focus',
      type: 'multi-select',
      title: 'What should we focus on?',
      illustrationImage: focusImg,
      options: [
        { label: 'Stop my negative thoughts', emoji: '🧠' },
        { label: 'Beat my procrastination', emoji: '⏰' },
        { label: 'Reduce my stress and anxiety', emoji: '😮‍💨' },
        { label: "Decode why I don't feel right", emoji: '🔍' },
        { label: 'Be more organized and disciplined', emoji: '📋' },
      ],
      buttonLabel: 'Continue',
    },
    // 5 - Multi-select: Desire to grow
    {
      id: 'desire-to-grow',
      type: 'multi-select',
      title: "What's fueling your desire to grow?",
      illustrationImage: desireGrowImg,
      options: [
        { label: 'Achieving my goal', emoji: '🎯' },
        { label: 'Feeling better', emoji: '😊' },
        { label: 'Improving my health', emoji: '💪' },
        { label: 'Becoming the person I want to be', emoji: '🌟' },
      ],
      buttonLabel: 'Continue',
    },
    // 6 - Yes/No: Focus
    {
      id: 'yn-focus',
      type: 'yes-no',
      title: 'Does this sound like you?',
      description: 'I struggle to focus and get things done.',
      illustrationImage: ynFocusImg,
    },
    // 7 - Yes/No: Tired
    {
      id: 'yn-tired',
      type: 'yes-no',
      title: 'Does this sound like you?',
      description: "I'm often too tired or unmotivated to do something productive.",
      illustrationImage: ynTiredImg,
    },
    // 8 - Yes/No: Busy
    {
      id: 'yn-busy',
      type: 'yes-no',
      title: 'Does this sound like you?',
      description: "I'm busy most days, and it feels hard to keep up.",
      illustrationImage: ynBusyImg,
    },
    // 9 - Do you want: Routines
    {
      id: 'dyw-routines',
      type: 'do-you-want',
      title: 'Do you want to ..',
      subtitle: 'Build healthy and sustainable routines?',
      buttonLabel: "Sure, let's go",
      secondaryButtonLabel: 'No',
      illustrationImage: dywRoutinesImg,
    },
    // 10 - Do you want: Productive
    {
      id: 'dyw-productive',
      type: 'do-you-want',
      title: 'Do you want to ..',
      subtitle: 'Be your most productive self?',
      buttonLabel: "Sure, let's go",
      secondaryButtonLabel: 'No',
      illustrationImage: dywProductiveImg,
    },
    // 11 - Do you want: Without pressure
    {
      id: 'dyw-no-pressure',
      type: 'do-you-want',
      title: 'Do you want to ..',
      subtitle: 'Build habits without pressure?',
      buttonLabel: "Sure, let's go",
      secondaryButtonLabel: 'No',
      illustrationImage: dywNoPressureImg,
    },
    // 12 - Rating prompt
    {
      id: 'rating-prompt',
      type: 'rating',
      title: 'Enjoying DearMe?',
      description: "Help improve us by rating us, and we'll do our best to make your experience even better.",
      buttonLabel: 'Give us 5 stars',
      secondaryButtonLabel: 'Maybe later',
      illustrationImage: ratingPromptImg,
    },
    // 13 - Rating with iOS dialog
    {
      id: 'rating-dialog',
      type: 'rating',
      title: 'Enjoying Dear Me?',
      subtitle: 'Tap a star to rate it on the App Store.',
      buttonLabel: 'Give us 5 stars',
      secondaryButtonLabel: 'Maybe later',
    },
    // 14 - Age
    {
      id: 'age',
      type: 'single-select',
      title: "First, let's get to know you.",
      subtitle: 'How old are you?',
      options: [
        { label: '18-29' },
        { label: '30-39' },
        { label: '40-49' },
        { label: '50+' },
      ],
    },
    // 15 - Gender
    {
      id: 'gender',
      type: 'single-select',
      title: "What's your gender?",
      options: [
        { label: 'Female', emoji: '♀️' },
        { label: 'Male', emoji: '♂️' },
        { label: 'Non-binary', emoji: '⚧️' },
        { label: 'Other', emoji: '🌈' },
      ],
    },
    // 16 - Sleep hours
    {
      id: 'sleep-hours',
      type: 'single-select',
      title: 'How many hours do you sleep?',
      options: [
        { label: '5 hours or less', emoji: '😴' },
        { label: 'About 6 hours', emoji: '🌙' },
        { label: 'About 7 hours', emoji: '😌' },
        { label: '8 hours or more', emoji: '💤' },
      ],
    },
    // 17 - Get out of bed
    {
      id: 'get-out-of-bed',
      type: 'single-select',
      title: 'Do you struggle to get out of bed?',
      options: [
        { label: 'Almost everyday' },
        { label: 'Often' },
        { label: 'Sometimes' },
        { label: 'Not at all' },
      ],
    },
    // 18 - Energy
    {
      id: 'energy',
      type: 'single-select',
      title: 'How energetic do you feel?',
      options: [
        { label: 'Drained', emoji: '😩' },
        { label: 'Tired', emoji: '😪' },
        { label: 'Normal', emoji: '😐' },
        { label: 'Energized', emoji: '⚡' },
      ],
    },
    // 19 - Sleep stat
    {
      id: 'sleep-stat',
      type: 'info-stat',
      statHighlight: "Over 57% of users don't get enough quality sleep",
      description: "We'll help you create a calm bedtime routine, so you can unwind and rest better",
      buttonLabel: 'Continue',
      illustrationImage: sleepStatImg,
    },
    // 20 - Stress level
    {
      id: 'stress-level',
      type: 'single-select',
      title: "What's your stress level?",
      options: [
        { label: 'In crisis', emoji: '🔴' },
        { label: 'Struggling', emoji: '🟠' },
        { label: 'Surviving', emoji: '🟡' },
        { label: 'Thriving', emoji: '🟢' },
      ],
    },
    // 21 - Support
    {
      id: 'support',
      type: 'single-select-descriptions',
      title: 'Do you feel supported by the people in your life?',
      options: [
        { label: 'Not really', description: 'I feel secluded' },
        { label: 'Sometimes', description: "I don't always feel the support" },
        { label: 'Yes', description: 'I am lucky to have people there for me' },
      ],
    },
    // 22 - Motivational: We are here
    {
      id: 'motivational-here',
      type: 'motivational',
      title: 'We are here with you.',
      description: "You don't have to figure everything out alone. We'll take this step by step together.",
      buttonLabel: 'Continue',
      illustrationImage: motivationalHereImg,
    },
    // 23 - Notification permission
    {
      id: 'notification-ask',
      type: 'notification-permission',
      title: 'Do you want to allow reminders to boost your success?',
      buttonLabel: 'Yes, please!',
      secondaryButtonLabel: 'Not now',
      illustrationImage: notificationImg,
    },
    // 24 - Notification iOS dialog
    {
      id: 'notification-dialog',
      type: 'notification-permission',
      title: 'Do you want to allow reminders to boost your success?',
      subtitle: '"Dear Me" Would Like to Send You Notifications',
      buttonLabel: 'Yes, please!',
      secondaryButtonLabel: 'Not now',
    },
    // 25 - Productivity
    {
      id: 'productivity',
      type: 'single-select-descriptions',
      title: 'How do you feel about your productivity?',
      options: [
        { label: 'Not satisfied', description: 'I am not where I want to be yet' },
        { label: 'Somewhat satisfied', description: 'I still struggle sometimes' },
        { label: 'Satisfied', description: "I'm content with my productivity level" },
      ],
    },
    // 26-27 - Results chart
    {
      id: 'results-chart',
      type: 'results-chart',
      title: 'Results',
      description: "Reach a 37x a better you by improving your routine just 1% each day. A key insight from James Clear's Atomic Habits is that small routines drive continuous growth. By improving just 1% daily, you'll be 37x better by year's end.",
      statHighlight: '37x',
      buttonLabel: "Great, let's go",
      illustrationImage: resultsChartImg,
    },
    // 28 - Habit Loop intro
    {
      id: 'habit-loop-intro',
      type: 'habit-loop',
      title: 'Habit Loop',
      subtitle: 'Build Better Habits with the Habit Loop',
      description: 'Habits follow a loop: cue triggers craving, response leads to reward. Recognize your cues, act on your cravings, and reward positive habits to make lasting changes in your daily life.',
      buttonLabel: 'Continue',
      illustrationImage: habitLoopImg,
    },
    // 29 - Habit Loop diagram
    {
      id: 'habit-loop-diagram',
      type: 'habit-loop',
      title: 'Build Better Habits with the Habit Loop',
      description: 'Habits follow a loop: cue triggers craving, response leads to reward. Recognize your cues, act on your cravings, and reward positive habits to make lasting changes in your daily life.',
      buttonLabel: 'Continue',
      illustrationLabel: 'Cue → Craving → Response → Reward',
    },
    // 30 - Focus question
    {
      id: 'focus-question',
      type: 'single-select',
      title: 'Is it hard for you to stay focused?',
      options: [
        { label: 'Often' },
        { label: 'Sometimes' },
        { label: 'Not at all' },
      ],
    },
    // 31 - Procrastinate
    {
      id: 'procrastinate',
      type: 'single-select-descriptions',
      title: 'Do you often procrastinate?',
      options: [
        { label: 'Very often', description: 'I want to change' },
        { label: 'Sometimes', description: 'I could use some improvement' },
        { label: 'Not often', description: "I'm getting my tasks done on schedule" },
      ],
    },
    // 32 - Focus stat
    {
      id: 'focus-stat',
      type: 'info-stat',
      statHighlight: 'Over 97% of users struggle to stay focused, too.',
      description: 'We help you create structure, regain focus, and breeze through your tasks.',
      buttonLabel: 'Continue',
      illustrationImage: focusStatImg,
    },
    // 33 - ADHD / CBT
    {
      id: 'adhd-cbt',
      type: 'science-backed',
      title: "Manage ADHD with Dear Me's Cognitive Behavioral Therapy Based Techniques",
      subtitle: 'ADHD Brain vs Non-ADHD Brain',
      description: 'Boosts focus and minimizes distractions. Provides reminders to stay on track. Strengthens time management and planning skills.',
      buttonLabel: "Great, let's go",
      illustrationImage: adhdCbtImg,
      checklistItems: [
        'Boosts focus and minimizes distractions',
        'Provides reminders to stay on track',
        'Strengthens time management and planning skills',
      ],
    },
    // 34 - Loading with testimonials 1
    {
      id: 'loading-1',
      type: 'loading-testimonials',
      title: 'Welcome to your Dear Me journey',
      subtitle: 'Your personal plan is being created..',
      illustrationImage: loading1Img,
      testimonials: [
        { name: 'Lisa M.', text: 'Really enjoying this app!' },
        { name: 'Jawad Z.', text: 'It makes my day so much better!' },
        { name: 'Malcom Y.', text: 'My go-to app every morning' },
        { name: 'Jade', text: 'Feel so organized now' },
      ],
    },
    // 35 - Loading with testimonials 2
    {
      id: 'loading-2',
      type: 'loading-testimonials',
      title: 'Welcome to your Dear Me journey',
      subtitle: 'Your personal plan is being created..',
      testimonials: [
        { name: 'Kader L.', text: 'Freedom from stress! It really helps me fix my schedule' },
        { name: 'Paula M.', text: 'Be organized! Helps me stay focused' },
      ],
    },
    // 36 - Personal summary
    {
      id: 'personal-summary',
      type: 'personal-summary',
      title: 'Here is your personal summary',
      illustrationImage: personalSummaryImg,
      summaryBars: [
        { label: 'Fitness', value: 35, status: 'Could be better' },
        { label: 'Wellness', value: 30, status: 'Could be better' },
        { label: 'Productivity', value: 25, status: 'Could be better' },
      ],
      statBadges: [
        { label: 'Tested by', value: '25M+ people' },
        { label: 'Method', value: 'Science-backed' },
        { label: 'Results', value: '94% accurate' },
      ],
      description: '94% of users meet their best self',
      buttonLabel: 'Continue',
    },
    // 37 - First habit
    {
      id: 'first-habit',
      type: 'first-habit',
      title: "Here's your first personalized habit.",
      subtitle: 'Take a deep breath',
      description: 'Today • Now',
      buttonLabel: "Let's do it",
    },
    // 38 - Breathing prep
    {
      id: 'breathing-prep',
      type: 'breathing-prep',
      title: "Let's get ready!",
      illustrationImage: breathingPrepImg,
    },
    // 39 - Breathing exercise
    {
      id: 'breathing-exercise',
      type: 'breathing',
      title: '1 breath',
      subtitle: 'Breathe in',
      description: '3',
      illustrationImage: breathingImg,
    },
    // 40 - Breathing done
    {
      id: 'breathing-done',
      type: 'breathing-done',
      title: 'Feeling better?',
      description: 'Your habit is already added to the list. You can customize your habits at any time.',
      subtitle: 'Take a deep breath',
      buttonLabel: 'Continue',
    },
    // 41-42 - Streak
    {
      id: 'streak-1',
      type: 'streak',
      title: 'BEST STREAK',
      statHighlight: '17 days',
      subtitle: "That's awesome!",
      description: "By dedicating yourself for just 21 days, you'll form a new habit that is here to last! Follow your streaks and aspire to reach your personal best!",
      buttonLabel: 'Continue',
    },
    {
      id: 'streak-2',
      type: 'streak',
      title: 'BEST STREAK',
      statHighlight: '19 days',
      subtitle: "That's awesome!",
      description: "By dedicating yourself for just 21 days, you'll form a new habit that is here to last! Follow your streaks and aspire to reach your personal best!",
      buttonLabel: 'Continue',
    },
    // 43 - Paywall 1
    {
      id: 'paywall-1',
      type: 'paywall',
      title: 'Be your most productive self',
      subtitle: 'Unlock unlimited habits & routines!',
      buttonLabel: 'Continue',
      illustrationImage: paywall1Img,
      pricingTiers: [
        { label: '1 month', perWeek: '$4.24 / week', total: '$16.99 for 1 month' },
        { label: '12 months', perWeek: '$1.53 / week', total: '$79.99 for a year', badge: 'BEST VALUE' },
        { label: '3 months', perWeek: '$3.07 / week', total: '$39.99 for 3 months', badge: 'POPULAR' },
      ],
    },
    // 44 - Paywall 2
    {
      id: 'paywall-2',
      type: 'paywall',
      title: 'Your Most Productive Self',
      subtitle: 'Unlock unlimited habits & routines!',
      buttonLabel: 'Continue',
      illustrationImage: paywall2Img,
      pricingTiers: [
        { label: '1 Month', perWeek: '$4.20 / week', total: '$16.99' },
        { label: '3 Months', perWeek: '$3.07 / week', total: '$39.99', badge: 'Popular' },
      ],
    },
    // 45 - Paywall 3 (half price after closing)
    {
      id: 'paywall-3',
      type: 'paywall',
      title: 'Be your most productive self',
      subtitle: 'Claim your newcomer gift now!',
      buttonLabel: 'Continue',
      pricingTiers: [
        { label: '1 month', perWeek: '$4.24 / week', total: '$16.99 for 1 month' },
        { label: '3 months', perWeek: '$3.07 / week', total: '$39.99 for 3 months' },
        { label: '12 months', perWeek: '$0.76 / week', total: '$39.99 for a year', badge: 'BEST VALUE' },
      ],
    },
    // 46 - Paywall 4
    {
      id: 'paywall-4',
      type: 'paywall',
      title: 'Be your most productive self',
      subtitle: 'Claim your newcomer gift now!',
      buttonLabel: 'Continue',
      pricingTiers: [
        { label: '1 month', perWeek: '$4.24 / week', total: '$16.99 for 1 month' },
        { label: '12 months', perWeek: '$0.76 / week', total: '$39.99 for a year', badge: 'BEST VALUE' },
        { label: '3 months', perWeek: '$3.07 / week', total: '$39.99 for 3 months' },
      ],
    },
    // 47 - Motivational final
    {
      id: 'motivational-final',
      type: 'motivational',
      title: 'Your journey toward a better you has already begun.',
      description: 'Now let us walk you through the rest, one small step at a time.',
      buttonLabel: 'Continue',
      illustrationImage: motivationalFinalImg,
    },
    // 48 - Science backed
    {
      id: 'science-backed',
      type: 'science-backed',
      title: 'Lasting change starts with proven methods.',
      description: 'We built Dear Me on Cognitive Behavioral Therapy, a proven method that helps 87% of individuals working to improve their lives build better habits.',
      buttonLabel: 'Continue',
      illustrationImage: scienceBackedImg,
      statBadges: [
        { label: 'HARVARD', value: '🏛️' },
        { label: 'JOHNS HOPKINS', value: '🏥' },
        { label: 'Stanford', value: '🎓' },
        { label: 'healthline', value: '📰' },
      ],
    },
    // 49 - Before/After
    {
      id: 'before-after',
      type: 'before-after',
      title: 'Time is now!',
      subtitle: 'Meet a better you.',
      buttonLabel: 'Continue',
      illustrationImage: beforeAfterImg,
      beforeItems: [
        'An unorganized day',
        'Unfinished goals',
        'Bad habits',
        'Anxiety and depression',
      ],
      afterItems: [
        'A structured day',
        'Goals achieved',
        'Habits that stick',
        'Peace of mind',
      ],
    },
    // 50 - Home screen (destination)
    {
      id: 'home-screen',
      type: 'home-screen',
      title: 'Home',
      illustrationImage: homeScreenImg,
    },
  ],
};
