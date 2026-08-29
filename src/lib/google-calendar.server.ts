// Google Calendarの予定を読み取り専用で取得する（表示のみ、書き込み・同期は行わない）。
// サービスアカウント方式：CEOがGoogleカレンダー側でサービスアカウントの
// メールアドレスに閲覧権限を共有している前提。鍵未設定・API呼び出し失敗時は
// 空配列を返し、Supabase側（calendar_events）の予定表示は妨げない。
import { JWT } from "google-auth-library";
import type { CalendarItem } from "./calendar.server";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

function getJwtClient(): JWT | null {
  const email = process.env["GOOGLE_SERVICE_ACCOUNT_EMAIL"];
  const rawKey = process.env["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"];
  if (!email || !rawKey) return null;
  return new JWT({ email, key: rawKey.replace(/\\n/g, "\n"), scopes: SCOPES });
}

const TIME_LABEL = (d: Date) =>
  d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

export interface GoogleCalendarItem {
  startAt: Date;
  item: CalendarItem;
}

interface GoogleEventsResponse {
  items?: {
    summary?: string;
    start?: { dateTime?: string; date?: string };
  }[];
}

/**
 * 指定期間のGoogleカレンダー予定を取得する。終日予定（date のみでdateTime
 * を持たないもの）は今回のスコープでは対象外（時刻表示前提のUIのため）。
 */
export async function listGoogleCalendarEvents(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<GoogleCalendarItem[]> {
  const calendarId = process.env["GOOGLE_CALENDAR_ID"];
  const client = getJwtClient();
  if (!client || !calendarId) return [];

  try {
    const { token } = await client.getAccessToken();
    if (!token) return [];

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.searchParams.set("timeMin", rangeStart.toISOString());
    url.searchParams.set("timeMax", rangeEnd.toISOString());
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(
        `Google Calendar API error (${res.status}): ${(await res.text()).slice(0, 200)}`,
      );
      return [];
    }

    const data = (await res.json()) as GoogleEventsResponse;
    return (data.items ?? [])
      .filter((e) => e.start?.dateTime)
      .map((e) => {
        const start = new Date(e.start!.dateTime!);
        return {
          startAt: start,
          item: {
            time: TIME_LABEL(start),
            title: e.summary ?? "（無題の予定）",
            kind: "Meeting",
            who: "CEO",
            source: "google",
          } satisfies CalendarItem,
        };
      });
  } catch (err) {
    console.error("Google Calendar fetch failed:", err);
    return [];
  }
}
