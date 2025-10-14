import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, ArrowRight, Star, Clock } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  rating: number;
  price: string;
  link: string;
  isPurchased: boolean;
}

interface CourseLibraryProps {
  purchasedCourses: string[];
}

export function CourseLibrary({ purchasedCourses }: CourseLibraryProps) {
  const allCourses: Course[] = [
    {
      id: 'iqmoney-income',
      title: 'IQMoney - Income Growth Program',
      description: 'Advanced strategies to dramatically increase your income with multiple streams and negotiation mastery.',
      image: '/src/assets/iqmoney-program.jpg',
      duration: 'Self-paced',
      rating: 5.0,
      price: '$1,997',
      link: '/iqmoney-income',
      isPurchased: purchasedCourses.includes('IQMoney - Income Growth Program')
    },
    {
      id: 'money-literacy',
      title: 'Money Literacy for LadyBoss',
      description: '52 video lessons covering budgeting, investing, debt elimination, and wealth building.',
      image: '/src/assets/money-literacy-program.jpg',
      duration: 'Self-paced',
      rating: 4.9,
      price: '$997',
      link: '/iqmoney',
      isPurchased: purchasedCourses.includes('Money Literacy for LadyBoss')
    },
    {
      id: 'ladyboss-vip',
      title: 'Ladyboss VIP Club',
      description: 'Exclusive 12-month VIP coaching program with weekly group sessions and elite community.',
      image: '/src/assets/ladyboss-vip-club.jpg',
      duration: '12 months',
      rating: 5.0,
      price: '$4,997',
      link: '/ladyboss-vip',
      isPurchased: purchasedCourses.includes('Ladyboss VIP Club')
    },
    {
      id: 'empowered-ladyboss',
      title: 'Empowered Ladyboss Group Coaching',
      description: '3-month group coaching for ambitious women entrepreneurs with weekly sessions.',
      image: '/src/assets/empowered-ladyboss-coaching.jpg',
      duration: '3 months',
      rating: 4.9,
      price: '$997',
      link: '/empowered-ladyboss',
      isPurchased: purchasedCourses.includes('Empowered Ladyboss Group Coaching')
    },
    {
      id: 'business-growth',
      title: 'Business Growth Accelerator',
      description: 'Transform your business into a profitable empire with proven growth frameworks.',
      image: '/src/assets/business-coaching-program.jpg',
      duration: '3 months',
      rating: 5.0,
      price: '$4,997',
      link: '/business-growth-accelerator',
      isPurchased: purchasedCourses.includes('Business Growth Accelerator')
    },
    {
      id: 'business-startup',
      title: 'Business Startup Accelerator',
      description: 'Launch your business from idea to profit in 3 months with complete startup guidance.',
      image: '/src/assets/networking-program.jpg',
      duration: '3 months',
      rating: 4.9,
      price: '$4,997',
      link: '/business-startup-accelerator',
      isPurchased: purchasedCourses.includes('Business Startup Accelerator')
    },
    {
      id: 'instagram-growth',
      title: 'Instagram Fast Growth Course',
      description: 'Rapidly grow your Instagram with proven strategies, content creation, and monetization.',
      image: '/src/assets/instagram-growth-course.jpg',
      duration: '3 months',
      rating: 5.0,
      price: '$2,997',
      link: '/instagram-growth',
      isPurchased: purchasedCourses.includes('Instagram Fast Growth Course')
    },
    {
      id: 'private-coaching',
      title: '1-Hour Private Session with Razie',
      description: 'Personalized breakthrough strategies in exclusive one-on-one coaching session.',
      image: '/src/assets/private-coaching-session.jpg',
      duration: '1 hour',
      rating: 5.0,
      price: '$597',
      link: '/private-coaching',
      isPurchased: purchasedCourses.includes('1-Hour Private Session with Razie')
    },
    {
      id: 'connection-literacy',
      title: 'Connection Literacy for Ladyboss',
      description: 'Master networking, building relationships, and expanding your professional network.',
      image: '/src/assets/connection-literacy-program.jpg',
      duration: '8 weeks',
      rating: 4.9,
      price: '$497',
      link: '/connection-literacy',
      isPurchased: purchasedCourses.includes('Connection Literacy for Ladyboss')
    },
    {
      id: 'courageous-character',
      title: 'Courageous Character Course',
      description: 'Master assertiveness & confidence as an immigrant with powerful communication skills.',
      image: '/src/assets/courageous-character-course.jpg',
      duration: '6 weeks',
      rating: 4.9,
      price: '$97',
      link: '/cc',
      isPurchased: purchasedCourses.includes('Courageous Character Course')
    }
  ];

  const purchased = allCourses.filter(c => c.isPurchased);
  const available = allCourses.filter(c => !c.isPurchased);

  return (
    <div className="space-y-8">
      {/* My Courses Section */}
      {purchased.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">My Courses</h3>
            <Badge variant="secondary">{purchased.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchased.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 right-3 bg-primary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enrolled
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 line-clamp-1">{course.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-secondary text-secondary" />
                      {course.rating}
                    </div>
                  </div>
                  <Button className="w-full" size="sm" onClick={() => window.location.href = course.link}>
                    Access Course
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Courses Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Available Courses</h3>
          <Badge variant="outline">{available.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map((course) => (
            <Card key={course.id} className="overflow-hidden opacity-90 hover:opacity-100 transition-opacity relative">
              <div className="aspect-video overflow-hidden relative">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover filter brightness-75"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 line-clamp-1">{course.title}</h4>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-secondary text-secondary" />
                    {course.rating}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">{course.price}</span>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = course.link}>
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
