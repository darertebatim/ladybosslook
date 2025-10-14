import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, PlayCircle, Star, Clock, Users } from "lucide-react";

interface Course {
  title: string;
  description: string;
  image: string;
  duration: string;
  participants: string;
  rating: number;
  features: string[];
  price: string;
  popular?: boolean;
  link: string;
}

interface CourseLibraryProps {
  purchasedCourses: string[];
}

const courses: Course[] = [
  {
    title: "Money Literacy Program",
    description: "Master financial planning, investment strategies, and wealth-building techniques.",
    image: "/src/assets/money-literacy-program.jpg",
    duration: "8 weeks",
    participants: "150+",
    rating: 4.9,
    features: ["Financial planning", "Investment strategies", "Wealth building", "Risk management"],
    price: "$499",
    popular: true,
    link: "/iqmoney-workshop"
  },
  {
    title: "Connection Literacy Program",
    description: "Develop authentic relationships and master the art of meaningful communication.",
    image: "/src/assets/connection-literacy-program.jpg",
    duration: "6 weeks",
    participants: "200+",
    rating: 4.8,
    features: ["Communication skills", "Relationship building", "Emotional intelligence", "Networking"],
    price: "$399",
    link: "/courageous-workshop"
  },
  {
    title: "Courageous Character Course",
    description: "Transform your mindset and build unshakeable confidence in all areas of life.",
    image: "/src/assets/courageous-character-course.jpg",
    duration: "4 weeks",
    participants: "180+",
    rating: 4.9,
    features: ["Confidence building", "Leadership skills", "Personal growth", "Mindset transformation"],
    price: "$97",
    popular: true,
    link: "/courageous-character"
  },
  {
    title: "Business Coaching Program",
    description: "Scale your business with proven strategies and personalized mentorship.",
    image: "/src/assets/business-coaching-program.jpg",
    duration: "12 weeks",
    participants: "100+",
    rating: 5.0,
    features: ["Business strategy", "Revenue growth", "Team building", "Market positioning"],
    price: "$1,999",
    link: "/business-growth-accelerator"
  },
  {
    title: "Empowered Ladyboss Coaching",
    description: "Leadership coaching designed specifically for ambitious women entrepreneurs.",
    image: "/src/assets/empowered-ladyboss-coaching.jpg",
    duration: "10 weeks",
    participants: "120+",
    rating: 4.9,
    features: ["Leadership development", "Business mindset", "Work-life balance", "Network building"],
    price: "$1,499",
    link: "/ladyboss-coaching"
  },
  {
    title: "Instagram Growth Course",
    description: "Build a powerful Instagram presence and convert followers into customers.",
    image: "/src/assets/instagram-growth-course.jpg",
    duration: "4 weeks",
    participants: "300+",
    rating: 4.7,
    features: ["Content strategy", "Audience growth", "Engagement tactics", "Monetization"],
    price: "$297",
    link: "/business-ideas"
  },
  {
    title: "Networking Program",
    description: "Master the art of networking and build valuable business relationships.",
    image: "/src/assets/networking-program.jpg",
    duration: "6 weeks",
    participants: "150+",
    rating: 4.8,
    features: ["Network strategy", "Relationship building", "Event tactics", "Follow-up systems"],
    price: "$399",
    link: "/courageous-workshop"
  },
  {
    title: "Ladyboss VIP Club",
    description: "Exclusive membership with ongoing support, resources, and community access.",
    image: "/src/assets/ladyboss-vip-club.jpg",
    duration: "Ongoing",
    participants: "80+",
    rating: 5.0,
    features: ["Monthly workshops", "Community access", "Exclusive resources", "Direct mentorship"],
    price: "$197/mo",
    link: "/ladyboss-coaching"
  },
  {
    title: "Private Coaching Session",
    description: "One-on-one personalized coaching tailored to your specific goals and challenges.",
    image: "/src/assets/private-coaching-session.jpg",
    duration: "1 session",
    participants: "1:1",
    rating: 5.0,
    features: ["Personalized guidance", "Goal setting", "Action planning", "Direct feedback"],
    price: "$497",
    link: "/ladyboss-coaching"
  },
  {
    title: "IQ Money Program",
    description: "Advanced financial intelligence training for wealth creation and management.",
    image: "/src/assets/iqmoney-program.jpg",
    duration: "8 weeks",
    participants: "130+",
    rating: 4.9,
    features: ["Financial IQ", "Asset building", "Tax strategies", "Passive income"],
    price: "$599",
    link: "/iqmoney-workshop"
  }
];

export function CourseLibrary({ purchasedCourses }: CourseLibraryProps) {
  const isPurchased = (courseTitle: string) => {
    return purchasedCourses.some(purchased => 
      purchased.toLowerCase().includes(courseTitle.toLowerCase()) ||
      courseTitle.toLowerCase().includes(purchased.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Library</h2>
          <p className="text-muted-foreground">Explore all available courses and programs</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {purchasedCourses.length} Enrolled
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const purchased = isPurchased(course.title);
          
          return (
            <Card key={course.title} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                {course.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary">
                    Most Popular
                  </Badge>
                )}
                {purchased ? (
                  <Badge className="absolute top-4 left-4 bg-green-600">
                    Enrolled
                  </Badge>
                ) : (
                  <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-full p-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.participants}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-2xl font-bold">{course.price}</span>
                  <Button asChild variant={purchased ? "default" : "outline"}>
                    <Link to={course.link}>
                      {purchased ? (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Learning
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Enroll Now
                        </>
                      )}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
