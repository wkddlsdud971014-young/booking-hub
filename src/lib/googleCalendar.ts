interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
}

const ACCESS_TOKEN = import.meta.env.VITE_GOOGLE_CALENDAR_ACCESS_TOKEN || '';

export async function addEventToCalendar(event: CalendarEvent): Promise<string | null> {
  if (!ACCESS_TOKEN) {
    console.error('Google Calendar access token not configured');
    return null;
  }

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error('Failed to add calendar event:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.id; // Calendar event ID
  } catch (error) {
    console.error('Error adding calendar event:', error);
    return null;
  }
}

export async function deleteEventFromCalendar(eventId: string): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.error('Google Calendar access token not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

export async function updateEventInCalendar(eventId: string, event: CalendarEvent): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.error('Google Calendar access token not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}
