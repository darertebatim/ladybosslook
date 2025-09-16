import { useEffect } from 'react';
import { generateGoogleCalendarUrl, webinarEvent } from '@/utils/calendar';

const CalendarRedirect = () => {
  useEffect(() => {
    // Redirect to Google Calendar immediately
    const calendarUrl = generateGoogleCalendarUrl(webinarEvent);
    window.location.href = calendarUrl;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
      <div className="text-center text-luxury-white">
        <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="font-farsi">در حال هدایت به تقویم گوگل...</p>
        <p className="text-sm text-luxury-silver/80 mt-2">Redirecting to Google Calendar...</p>
      </div>
    </div>
  );
};

export default CalendarRedirect;