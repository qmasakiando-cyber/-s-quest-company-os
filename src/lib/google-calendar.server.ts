// Google Calendarの予定を読み取り専用で取得する（表示のみ、書き込み・同期は行わない）。
// サービスアカウント方式：CEOがGoogleカレンダー側でサービスアカウントの
// メールアドレスに閲覧権限を共有している前提。鍵未設定・API呼び出し失敗時は
// 空配列を返し、Supabase側（calendar_events）の予定表示は妨げない。
//
// JWT Bearerフロー（RFC 7523）をWeb Crypto API（crypto.subtle）で自前実装
// している。google-auth-libraryはNode専用APIに依存する部分がありCloudflare
// Workers（nodejs_compat環境）で "No such module 'node:process'" のように
// 壊れたため、標準Web APIのみで完結する形に置き換えた。Node（ローカル開発）
// でもWorkersでも同じコードで動く。
import type { CalendarItem } from "./calendar.server";

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function base64url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlFromString(input: string): string {
  return base64url(new TextEncoder().encode(input).buffer as ArrayBuffer);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const base64Body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(base64Body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der.buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/**
 * サービスアカウントのJWTに署名してGoogleのトークンエンドポイントに交換し、
 * アクセストークンを取得する。失敗時はnullを返す（呼び出し側でフォールバック）。
 */
async function getAccessToken(
  email: string,
  privateKeyPem: string,
): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlFromString(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  );
  const claims = base64urlFromString(
    JSON.stringify({
      iss: email,
      scope: SCOPES,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claims}`;

  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    console.error(
      `Google token exchange failed (${res.status}): ${(await res.text()).slice(0, 200)}`,
    );
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
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
  const email = process.env["GOOGLE_SERVICE_ACCOUNT_EMAIL"];
  const rawKey = process.env["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"];
  if (!calendarId || !email || !rawKey) return [];

  try {
    const token = await getAccessToken(email, rawKey.replace(/\\n/g, "\n"));
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
