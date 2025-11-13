import moneyLiteracyImage from '@/assets/money-literacy-program.jpg';
import businessCoachingImage from '@/assets/business-coaching-program.jpg';
import networkingImage from '@/assets/networking-program.jpg';
import courageousCharacterImage from '@/assets/courageous-character-course.jpg';
import iqmoneyImage from '@/assets/iqmoney-program.jpg';
import empoweredLadybossImage from '@/assets/empowered-ladyboss-coaching.jpg';
import ladybossVipImage from '@/assets/ladyboss-vip-club.jpg';
import connectionLiteracyImage from '@/assets/connection-literacy-program.jpg';
import instagramGrowthImage from '@/assets/instagram-growth-course.jpg';
import privateCoachingImage from '@/assets/private-coaching-session.jpg';

export interface Program {
  title: string;
  slug: string;
  description: string;
  image: string;
  duration: string;
  participants: string;
  rating: number;
  features: string[];
  price: string;
  priceAmount: number;
  originalPrice?: string;
  limitedSpots?: string;
  popular: boolean;
  link: string;
  type: 'course' | 'group-coaching' | '1o1-session' | 'event' | 'webinar' | 'audiobook';
  paymentType: 'one-time' | 'subscription' | 'free';
  isFree: boolean;
  subscriptionDuration?: string;
  subscriptionFullPaymentDiscount?: number;
  deliveryMethod?: string;
  stripe_payment_link?: string;
  ios_product_id?: string;
  android_product_id?: string;
}

// Image mapping for programs
export const programImages: Record<string, string> = {
  'iqmoney-income-growth': iqmoneyImage,
  'money-literacy-course': moneyLiteracyImage,
  'ladyboss-vip-club': ladybossVipImage,
  'empowered-ladyboss-coaching': empoweredLadybossImage,
  'business-growth-accelerator': businessCoachingImage,
  'business-startup-accelerator': networkingImage,
  'instagram-growth-course': instagramGrowthImage,
  'private-coaching-session': privateCoachingImage,
  'connection-literacy-course': connectionLiteracyImage,
  'courageous-character-course': courageousCharacterImage,
  'bilingual-power-class': courageousCharacterImage,
  'default': moneyLiteracyImage,
};

// Legacy static programs array - DEPRECATED
// All program data should now be managed through the database
// This is kept for backwards compatibility during migration
export const programs: Program[] = [
  {
    title: 'IQMoney Course - Income Growth',
    slug: 'iqmoney-income-growth',
    description: 'Advanced strategies to dramatically increase your income. Learn multiple income streams, negotiation mastery, and proven tactics to maximize your earning potential as an ambitious entrepreneur.',
    image: iqmoneyImage,
    duration: 'Self-paced',
    participants: '12,000+',
    rating: 5.0,
    features: [
      'Multiple Income Stream Strategies',
      'Advanced Negotiation Mastery',
      'Premium Pricing Psychology',
      'High-Ticket Sales Training',
      'Income Multiplication Framework'
    ],
    price: '$1,997',
    priceAmount: 1997,
    popular: true,
    link: '/iqmoney-income',
    type: 'course',
    paymentType: 'one-time',
    isFree: false
  },
  {
    title: 'Money Literacy Course',
    slug: 'money-literacy-course',
    description: 'Complete financial education system with 52 video lessons covering budgeting, investing, debt elimination, and wealth building. Designed specifically for ambitious women seeking financial independence.',
    image: moneyLiteracyImage,
    duration: 'Self-paced',
    participants: '60,000+',
    rating: 4.9,
    features: [
      '52 Expert-Led Video Lessons',
      'Financial Confidence Building',
      'Investment Psychology Mastery',
      'Business Building Strategies',
      'Lifetime Access & Community'
    ],
    price: '$997',
    priceAmount: 997,
    popular: false,
    link: '/iqmoney',
    type: 'course',
    paymentType: 'one-time',
    isFree: false
  },
  {
    title: 'Ladyboss VIP Club Group Coaching',
    slug: 'ladyboss-vip-club',
    description: 'Join our most exclusive 12-month VIP coaching program. Weekly group sessions with premium access, advanced strategies, and an elite community of successful women entrepreneurs.',
    image: ladybossVipImage,
    duration: '12 months',
    participants: '500+',
    rating: 5.0,
    features: [
      'Weekly VIP Group Coaching',
      'Exclusive Elite Community Access',
      'Advanced Business Strategies',
      'Priority Support & Resources',
      'Year-Long Transformation Program'
    ],
    price: '$4,997',
    priceAmount: 4997,
    popular: true,
    link: '/ladyboss-vip',
    type: 'group-coaching',
    paymentType: 'subscription',
    isFree: false
  },
  {
    title: 'Empowered Ladyboss Group Coaching',
    slug: 'empowered-ladyboss-coaching',
    description: 'Join our exclusive 3-month group coaching program for ambitious women entrepreneurs. Weekly sessions focused on leadership, business growth, and building your empire with a supportive community.',
    image: empoweredLadybossImage,
    duration: '3 months',
    participants: '2,500+',
    rating: 4.9,
    features: [
      'Weekly Live Group Coaching',
      'Empowered Leadership Training',
      'Business Strategy & Growth',
      'Supportive Community Network',
      'Accountability & Support System'
    ],
    price: '$997',
    priceAmount: 997,
    popular: false,
    link: '/empowered-ladyboss',
    type: 'group-coaching',
    paymentType: 'subscription',
    isFree: false
  },
  {
    title: 'Business Growth Accelerator - 3-Month 1o1 Weekly Session',
    slug: 'business-growth-accelerator',
    description: 'Transform your existing business into a profitable empire with our comprehensive coaching program and proven growth frameworks. 3-month semi-private weekly sessions.',
    image: businessCoachingImage,
    duration: '3 months',
    participants: '3,200+',
    rating: 5.0,
    features: [
      'Advanced Business Strategy',
      'Revenue Optimization',
      'Marketing & Sales Mastery',
      'Leadership Development',
      'Semi-Private Weekly Sessions'
    ],
    price: '$4,997',
    priceAmount: 4997,
    popular: false,
    link: '/business-growth-accelerator',
    type: '1o1-session',
    paymentType: 'one-time',
    isFree: false
  },
  {
    title: 'Business Startup Accelerator - 3-Month 1o1 Weekly Session',
    slug: 'business-startup-accelerator',
    description: 'Launch your business from idea to profit in 3 months. Complete startup program with step-by-step guidance, legal setup, and launch strategy. Semi-private weekly sessions.',
    image: networkingImage,
    duration: '3 months',
    participants: '1,800+',
    rating: 4.9,
    features: [
      'Business Idea Validation',
      'Complete Legal Setup',
      'Brand & Website Creation',
      'Launch Strategy & Marketing',
      'Semi-Private Weekly Sessions'
    ],
    price: '$4,997',
    priceAmount: 4997,
    popular: false,
    link: '/business-startup-accelerator',
    type: '1o1-session',
    paymentType: 'one-time',
    isFree: false
  },
  {
    title: 'Instagram Fast Growth Course',
    slug: 'instagram-growth-course',
    description: 'Rapidly grow your Instagram following and engagement with proven strategies. 3-month semi-private coaching program teaching content creation, algorithm mastery, monetization tactics, and building an engaged community.',
    image: instagramGrowthImage,
    duration: '3 months',
    participants: '2,800+',
    rating: 5.0,
    features: [
      'Content Strategy & Creation',
      'Algorithm Mastery & Growth Hacks',
      'Engagement & Community Building',
      'Monetization Strategies',
      'Semi-Private Weekly Sessions'
    ],
    price: '$2,997',
    priceAmount: 2997,
    popular: true,
    link: '/instagram-growth',
    type: 'course',
    paymentType: 'one-time',
    isFree: false
  },
  {
    title: '1-Hour Private Session with Razie',
    slug: 'private-coaching-session',
    description: 'Get personalized guidance and breakthrough strategies in an exclusive one-on-one coaching session with Razie Ladyboss. Perfect for tackling specific challenges and accelerating your success.',
    image: privateCoachingImage,
    duration: '1 hour',
    participants: '500+',
    rating: 5.0,
    features: [
      'Personalized One-on-One Coaching',
      'Breakthrough Strategy Session',
      'Customized Action Plan',
      'Direct Access to Razie',
      'Follow-up Resources Included'
    ],
    price: '$597',
    priceAmount: 597,
    popular: false,
    link: '/private-coaching',
    type: '1o1-session',
    paymentType: 'one-time',
    isFree: false
  },
  {
    title: 'Connection Literacy Course',
    slug: 'connection-literacy-course',
    description: 'Master the art of building meaningful relationships and expanding your professional network. Learn proven strategies for networking, making lasting connections, and leveraging relationships to grow your influence and business.',
    image: connectionLiteracyImage,
    duration: '8 weeks',
    participants: '3,500+',
    rating: 4.9,
    features: [
      'Strategic Networking Techniques',
      'Relationship Building Mastery',
      'Social Influence & Persuasion',
      'Professional Connection Strategies',
      'Community Building Skills'
    ],
    price: '$497',
    priceAmount: 497,
    popular: false,
    link: '/connection-literacy',
    type: 'course',
    paymentType: 'one-time',
    isFree: false
  },
  {
    title: 'Courageous Character Course',
    slug: 'courageous-character-course',
    description: 'Master assertiveness & confidence as an immigrant. Build the mindset & communication skills you need to succeed in the U.S.',
    image: courageousCharacterImage,
    duration: '6 weeks',
    participants: '1,800+',
    rating: 4.9,
    features: [
      'Overcome Fear & Self-Doubt',
      'Master Assertive Communication',
      'Negotiate for What You Deserve',
      'Build Powerful Connections',
      'Lead with Confidence'
    ],
    price: '$97',
    priceAmount: 97,
    originalPrice: '$497',
    limitedSpots: 'Limited to 100',
    popular: false,
    link: '/cc',
    type: 'course',
    paymentType: 'one-time',
    isFree: false
  },
  {
    title: 'Bilingual Power Class - کلاس قدرت دو زبانه',
    slug: 'bilingual-power-class',
    description: 'Learn to speak with power in any language. Special online class for Iranian immigrant women - master 5 languages of power to transform your life.',
    image: courageousCharacterImage, // Reusing for now, can be updated later
    duration: '1 session',
    participants: '264,000+',
    rating: 4.9,
    features: [
      'Internal Language of Power',
      'External Language of Power',
      'Cultural Language Mastery',
      'Language of Presence',
      'Language of Influence'
    ],
    price: '$1',
    priceAmount: 1,
    originalPrice: '$100',
    limitedSpots: 'Limited to 1000',
    popular: true,
    link: '/one',
    type: 'webinar',
    paymentType: 'one-time',
    isFree: false
  }
];
