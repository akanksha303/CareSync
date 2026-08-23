import { google } from 'googleapis';
import { prisma } from '../config/prisma';

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(userId: string, role: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: JSON.stringify({ userId, role }),
    prompt: 'consent',
  });
}

export async function handleCallback(code: string): Promise<{ access_token: string; refresh_token: string }> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token) throw new Error('No access token received');
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || '',
  };
}

function getAuthedClient(accessToken: string, refreshToken?: string) {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return client;
}

export async function createCalendarEvent(
  userId: string,
  eventDetails: {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail?: string;
  }
): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.google_access_token) return null;

    const auth = getAuthedClient(user.google_access_token, user.google_refresh_token || undefined);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: { dateTime: eventDetails.startTime.toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: eventDetails.endTime.toISOString(), timeZone: 'Asia/Kolkata' },
        attendees: eventDetails.attendeeEmail ? [{ email: eventDetails.attendeeEmail }] : [],
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
      },
    });
    return event.data.id || null;
  } catch (err) {
    console.error('[Calendar] createCalendarEvent failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  updates: { startTime?: Date; endTime?: Date; summary?: string }
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.google_access_token) return false;
    const auth = getAuthedClient(user.google_access_token, user.google_refresh_token || undefined);
    const calendar = google.calendar({ version: 'v3', auth });
    const patch: Record<string, unknown> = {};
    if (updates.summary) patch.summary = updates.summary;
    if (updates.startTime) patch.start = { dateTime: updates.startTime.toISOString(), timeZone: 'Asia/Kolkata' };
    if (updates.endTime) patch.end = { dateTime: updates.endTime.toISOString(), timeZone: 'Asia/Kolkata' };
    await calendar.events.patch({ calendarId: 'primary', eventId, requestBody: patch });
    return true;
  } catch (err) {
    console.error('[Calendar] updateCalendarEvent failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.google_access_token) return false;
    const auth = getAuthedClient(user.google_access_token, user.google_refresh_token || undefined);
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({ calendarId: 'primary', eventId });
    return true;
  } catch (err) {
    console.error('[Calendar] deleteCalendarEvent failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
