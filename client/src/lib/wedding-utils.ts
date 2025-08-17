export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getWeddingCountdown(): CountdownTime {
  const weddingDate = new Date('2025-10-11T12:00:00+02:00'); // Czech timezone
  const now = new Date();
  const distance = weddingDate.getTime() - now.getTime();

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function createGoogleCalendarUrl(): string {
  const startDate = new Date('2025-10-11T12:00:00+02:00');
  const endDate = new Date('2025-10-11T16:00:00+02:00');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Svatba Marcela a Zbyněk',
    dates: `${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}`,
    details: 'Svatba ve Stará Pošta, Kovalovice 109',
    location: 'Kovalovice 109, Česká republika'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
