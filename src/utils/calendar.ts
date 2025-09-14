// Calendar utility functions for event creation

interface EventDetails {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

// Convert date to format required for Google Calendar (YYYYMMDDTHHMMSSZ)
const formatGoogleDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

// Generate Google Calendar URL
export const generateGoogleCalendarUrl = (event: EventDetails): string => {
  const startTime = formatGoogleDate(event.startDate);
  const endTime = formatGoogleDate(event.endDate);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startTime}/${endTime}`,
    details: event.description,
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Generate ICS file content for Apple Calendar and other calendar apps
export const generateICSFile = (event: EventDetails): string => {
  const startTime = formatGoogleDate(event.startDate);
  const endTime = formatGoogleDate(event.endDate);
  const now = formatGoogleDate(new Date());
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Your App//Your App//EN',
    'BEGIN:VEVENT',
    `UID:${now}@yourapp.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location || ''}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
};

// Download ICS file
export const downloadICSFile = (event: EventDetails, filename: string = 'event.ics'): void => {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Webinar event details - September 28, 2025, 9:30 AM Los Angeles time
export const webinarEvent: EventDetails = {
  title: 'Free Live "رونمایی از کاراکتر پرجرات"',
  description: 'وبینار رایگان رونمایی از کاراکتر پرجرات - به ما ملحق شوید برای این رویداد ویژه!\n\nلینک پخش: https://youtube.com/live/ofrgyfGl5ic?feature=share',
  startDate: new Date('2025-09-28T09:30:00-07:00'), // Los Angeles time (PDT)
  endDate: new Date('2025-09-28T10:15:00-07:00'), // 45 minutes duration
  location: 'https://youtube.com/live/ofrgyfGl5ic?feature=share'
};