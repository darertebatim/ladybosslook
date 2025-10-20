import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const RecentRegistrations = () => {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const notifications = [
    { name: "Sara from Toronto", time: "2 minutes ago" },
    { name: "مریم از لس آنجلس", time: "5 دقیقه پیش" },
    { name: "Nazanin from London", time: "8 minutes ago" },
    { name: "لیلا از سیدنی", time: "12 دقیقه پیش" },
    { name: "Parisa from Vancouver", time: "15 minutes ago" }
  ];

  useEffect(() => {
    // Show notification every 10 seconds
    const interval = setInterval(() => {
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
        setCurrentNotification((prev) => (prev + 1) % notifications.length);
      }, 5000); // Show for 5 seconds
    }, 10000); // Every 10 seconds

    // Show first one immediately
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed bottom-24 left-4 z-40 transition-all duration-500 ${
      isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
    }`}>
      <div className="bg-luxury-white border-2 border-secondary/50 rounded-xl shadow-2xl p-4 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-luxury-black text-sm">
              {notifications[currentNotification].name}
            </p>
            <p className="text-luxury-accent/70 text-xs">
              Just registered • {notifications[currentNotification].time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentRegistrations;
